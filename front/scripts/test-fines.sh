#!/bin/bash

# Script para probar el sistema de multas con curl
# Autor: Claude
# Fecha: 2023

# Configuración
API_BASE="http://201.142.179.241:1337"
TOKEN="" # Aquí debes poner tu token JWT

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # Sin color

# Función para obtener un token (deberías implementarla según tu sistema de autenticación)
get_token() {
  echo -e "${YELLOW}Obteniendo token de autenticación...${NC}"
  # Ejemplo de cómo obtener un token (ajusta según tu sistema)
  LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/api/auth/local \
    -H 'Content-Type: application/json' \
    -d '{"identifier":"tu_usuario","password":"tu_contraseña"}')
  
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"jwt":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: No se pudo obtener el token.${NC}"
    echo "Respuesta del servidor: $LOGIN_RESPONSE"
    exit 1
  else
    echo -e "${GREEN}Token obtenido correctamente.${NC}"
  fi
}

# Función para verificar si necesitamos autenticación
check_auth() {
  if [ -z "$TOKEN" ]; then
    get_token
  fi
}

# Función para obtener préstamos
get_loans() {
  echo -e "${YELLOW}Obteniendo lista de préstamos...${NC}"
  check_auth
  
  curl -s -X GET "$API_BASE/api/loans?populate=*" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' | jq '.'
}

# Función para obtener préstamos atrasados
get_overdue_loans() {
  echo -e "${YELLOW}Obteniendo préstamos atrasados...${NC}"
  check_auth
  
  curl -s -X GET "$API_BASE/api/loans?filters[estado]=atrasado&populate=*" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' | jq '.'
}

# Función para calcular multa de un préstamo específico
calculate_fine() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un ID de préstamo.${NC}"
    return 1
  fi
  
  LOAN_ID=$1
  echo -e "${YELLOW}Calculando multa para préstamo ID: $LOAN_ID${NC}"
  check_auth
  
  curl -s -X GET "$API_BASE/api/calculate-fine/$LOAN_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' | jq '.'
}

# Función para calcular todas las multas
calculate_all_fines() {
  echo -e "${YELLOW}Calculando multas para todos los préstamos atrasados...${NC}"
  check_auth
  
  curl -s -X POST "$API_BASE/api/calculate-all-fines" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' | jq '.'
}

# Función para actualizar manualmente la multa de un préstamo
update_fine() {
  if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo -e "${RED}Error: Debes proporcionar ID del préstamo, días de atraso y monto de multa.${NC}"
    return 1
  fi
  
  LOAN_ID=$1
  DAYS_LATE=$2
  FINE=$3
  
  echo -e "${YELLOW}Actualizando multa para préstamo ID: $LOAN_ID${NC}"
  check_auth
  
  curl -s -X PUT "$API_BASE/api/loans/$LOAN_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{
      \"data\": {
        \"estado\": \"atrasado\",
        \"dias_atraso\": $DAYS_LATE,
        \"multa\": $FINE
      }
    }" | jq '.'
}

# Menú principal
show_menu() {
  echo -e "\n${GREEN}===== Sistema de Pruebas de Multas =====${NC}"
  echo "1. Obtener todos los préstamos"
  echo "2. Obtener préstamos atrasados"
  echo "3. Calcular multa para un préstamo específico"
  echo "4. Calcular todas las multas"
  echo "5. Actualizar multa manualmente"
  echo "0. Salir"
  echo -e "${YELLOW}Selecciona una opción:${NC} "
  read option
  
  case $option in
    1) get_loans ;;
    2) get_overdue_loans ;;
    3)
      echo -e "${YELLOW}Ingresa el ID del préstamo:${NC} "
      read loan_id
      calculate_fine $loan_id
      ;;
    4) calculate_all_fines ;;
    5)
      echo -e "${YELLOW}Ingresa el ID del préstamo:${NC} "
      read loan_id
      echo -e "${YELLOW}Ingresa días de atraso:${NC} "
      read days_late
      echo -e "${YELLOW}Ingresa monto de multa:${NC} "
      read fine
      update_fine $loan_id $days_late $fine
      ;;
    0) exit 0 ;;
    *) echo -e "${RED}Opción no válida${NC}" ;;
  esac
  
  show_menu
}

# Inicio del script
echo -e "${GREEN}Script de prueba para el sistema de multas${NC}"
echo -e "${YELLOW}API Base: $API_BASE${NC}"

# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
  echo -e "${RED}Error: Este script requiere 'jq' para formatear JSON. Por favor instálalo con:${NC}"
  echo "brew install jq (macOS) o apt-get install jq (Linux)"
  exit 1
fi

# Mostrar el menú
show_menu 