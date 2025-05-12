# Comandos CURL para probar el sistema de multas

## Configuración
Reemplaza `TU_TOKEN` con tu token JWT válido.
URL base: `http://201.142.179.241:1337`

## Obtener un token

```bash
curl -X POST http://201.142.179.241:1337/api/auth/local \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"tu_usuario","password":"tu_contraseña"}'
```

## Consultar todos los préstamos

```bash
curl -X GET "http://201.142.179.241:1337/api/loans?populate=*" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json'
```

## Consultar préstamos atrasados

```bash
curl -X GET "http://201.142.179.241:1337/api/loans?filters[estado]=atrasado&populate=*" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json'
```

## Calcular multa para un préstamo específico
Reemplaza `ID_PRESTAMO` con el ID del préstamo.

```bash
curl -X GET "http://201.142.179.241:1337/api/calculate-fine/ID_PRESTAMO" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json'
```

## Calcular todas las multas

```bash
curl -X POST "http://201.142.179.241:1337/api/calculate-all-fines" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json'
```

## Actualizar multa manualmente
Reemplaza `ID_PRESTAMO`, `DIAS_ATRASO` y `MONTO_MULTA` con los valores correspondientes.

```bash
curl -X PUT "http://201.142.179.241:1337/api/loans/ID_PRESTAMO" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "estado": "atrasado",
      "dias_atraso": DIAS_ATRASO,
      "multa": MONTO_MULTA
    }
  }'
```

## Verificar préstamos atrasados (actualiza automáticamente el estado y la multa)

```bash
curl -X GET "http://201.142.179.241:1337/api/check-overdue-loans" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H 'Content-Type: application/json'
```

## Modelo para el backend

Para implementar estas funcionalidades en el backend, necesitarás añadir las siguientes rutas en tu API:

1. `GET /api/calculate-fine/:id` - Calcula la multa para un préstamo específico
2. `POST /api/calculate-all-fines` - Calcula multas para todos los préstamos atrasados
3. `GET /api/check-overdue-loans` - Verifica y actualiza préstamos atrasados

Ejemplo de implementación para el controlador de multas (en Strapi o tu backend):

```javascript
module.exports = {
  // Calcular multa para un préstamo específico
  calculateFine: async (ctx) => {
    try {
      const { id } = ctx.params;
      
      // Obtener el préstamo
      const loan = await strapi.entityService.findOne('api::loan.loan', id, {
        populate: '*'
      });
      
      if (!loan) {
        return ctx.notFound('Préstamo no encontrado');
      }
      
      // Verificar si está atrasado
      const today = new Date();
      const dueDate = new Date(loan.fecha_devolucion_esperada);
      const isOverdue = dueDate < today;
      
      // Si no está atrasado, no hay multa
      if (!isOverdue) {
        return {
          multa: 0,
          dias_atraso: 0
        };
      }
      
      // Calcular días de atraso y multa
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fine = diffDays * 5; // $5 por día de atraso
      
      // Actualizar el préstamo con la multa calculada
      if (loan.estado !== 'atrasado' || loan.multa !== fine || loan.dias_atraso !== diffDays) {
        await strapi.entityService.update('api::loan.loan', id, {
          data: {
            estado: 'atrasado',
            dias_atraso: diffDays,
            multa: fine
          }
        });
      }
      
      return {
        multa: fine,
        dias_atraso: diffDays
      };
    } catch (err) {
      ctx.throw(500, err);
    }
  },
  
  // Calcular multas para todos los préstamos atrasados
  calculateAllFines: async (ctx) => {
    try {
      const loans = await strapi.entityService.findMany('api::loan.loan', {
        filters: {
          $or: [
            { estado: 'activo' },
            { estado: 'renovado' },
            { estado: 'atrasado' }
          ],
          fecha_devolucion_esperada: {
            $lt: new Date()
          }
        },
        populate: '*'
      });
      
      const results = {
        totalUpdated: 0,
        details: []
      };
      
      // Procesar cada préstamo
      for (const loan of loans) {
        try {
          const today = new Date();
          const dueDate = new Date(loan.fecha_devolucion_esperada);
          
          // Calcular multa
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const fine = diffDays * 5; // $5 por día de atraso
          
          // Actualizar el préstamo
          await strapi.entityService.update('api::loan.loan', loan.id, {
            data: {
              estado: 'atrasado',
              dias_atraso: diffDays,
              multa: fine
            }
          });
          
          // Añadir a resultados
          results.details.push({
            id: loan.id,
            documentId: loan.documentId || null,
            libro: loan.book?.titulo || 'Desconocido',
            usuario: loan.usuario?.username || 'Desconocido',
            fecha_vencimiento: loan.fecha_devolucion_esperada,
            dias_atraso: diffDays,
            multa: fine
          });
          
          results.totalUpdated++;
        } catch (err) {
          console.error(`Error al procesar préstamo ID ${loan.id}:`, err);
        }
      }
      
      return results;
    } catch (err) {
      ctx.throw(500, err);
    }
  }
};
``` 