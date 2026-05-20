---
id: multi-tenant-empresas-spec-messaging
version: 1
lineage:
  derived_from: multi-tenant-empresas-propose
capability: messaging
created_at: "2026-05-20T18:10:00Z"
---

# Delta Spec: Mensajería Multi-Empresa

## REQ-MSG-001: Mensajes scoped por empresa

Todo mensaje enviado DEBE quedar asociado a la empresa activa del remitente. Las queries DEVOLVER solo mensajes de la empresa seleccionada.

### Scenario: Enviar mensaje dentro de la empresa
- **Given** un usuario logueado en "Acme Corp" (empresaId: "a1")
- **When** envía un mensaje a otro usuario de "Acme Corp"
- **Then** el mensaje se crea con `empresaId: "a1"`
- **And** ambos usuarios pueden verlo en sus bandejas

### Scenario: Mensaje no visible desde otra empresa
- **Given** un mensaje enviado en "Acme Corp" (empresaId: "a1")
- **And** el mismo usuario logueado en "Beta SA" (empresaId: "b1")
- **When** consulta su inbox en "Beta SA"
- **Then** el mensaje de "Acme Corp" NO aparece

### Scenario: Bandeja de entrada scoped
- **Given** un usuario que pertenece a "Acme Corp" y "Beta SA"
- **When** consulta `GET /v1/messaging/inbox` con token de "Acme Corp"
- **Then** solo ve mensajes donde es recipient y `empresaId === "a1"`

### Scenario: Búsqueda scoped
- **Given** múltiples mensajes en distintas empresas
- **When** busca `GET /v1/messaging/search?q=informe` con token de "Beta SA"
- **Then** solo recibe resultados de "Beta SA"

---

## REQ-MSG-002: Grupos scoped por empresa

Los grupos DEBEN pertenecer a una empresa. Solo miembros de esa empresa pueden verlos o interactuar.

### Scenario: Crear grupo
- **Given** un usuario en "Acme Corp"
- **When** crea un grupo
- **Then** el grupo se crea con `empresaId` de "Acme Corp"
- **And** el creador queda como ADMIN del grupo

### Scenario: No ver grupos de otra empresa
- **Given** un grupo creado en "Acme Corp"
- **When** el mismo usuario consulta sus grupos con token de "Beta SA"
- **Then** el grupo de "Acme Corp" NO aparece

---

## REQ-MSG-003: Borradores scoped por empresa

Los borradores DEBEN pertenecer a la empresa activa.

### Scenario: Guardar borrador
- **Given** un usuario logueado en "Acme Corp"
- **When** guarda un borrador
- **Then** el borrador se crea con `empresaId: "a1"`

### Scenario: Listar borradores scoped
- **Given** borradores guardados en diferentes empresas
- **When** lista sus borradores con token de "Acme Corp"
- **Then** solo ve borradores con `empresaId === "a1"`

---

## REQ-MSG-004: Hilos de conversación scoped

Los ConversationThread DEBEN estar vinculados a una empresa.

### Scenario: Hilo pertenece a empresa
- **Given** un mensaje inicial en "Acme Corp" que crea un hilo
- **When** se responde dentro del hilo
- **Then** el hilo y todas las respuestas comparten el mismo `empresaId`

---

## REQ-MSG-005: Migración — Empresa Default

La migración DEBE crear una empresa "Default" y asignar TODOS los registros existentes a ella.

### Scenario: Post-migración
- **Given** la migración ejecutada
- **Then** existe una empresa con nombre "Default"
- **And** todos los usuarios existentes tienen user_empresas apuntando a "Default"
- **And** todos los mensajes existentes tienen empresaId = id de "Default"
- **And** todos los grupos existentes tienen empresaId = id de "Default"
- **And** todos los drafts existentes tienen empresaId = id de "Default"
- **And** todos los conversation_threads existentes tienen empresaId = id de "Default"
