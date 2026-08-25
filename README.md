# Reservations App Front

Frontend independiente para el monolito de reservas. Usa Next.js App Router, React, TypeScript estricto, TanStack Query, React Hook Form, Zod y Tailwind CSS.

## Requisitos

- Node.js 24 LTS
- API Quarkus ejecutándose en `http://localhost:8080`

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre `http://localhost:3000`. Una empresa se registra en `/registro`, ingresa en `/login` y administra su espacio en `/admin`. El portal anónimo de clientes usa `/{tenantSlug}`.

## Recorrido funcional

1. Registra una empresa y elige un plan.
2. Si es pago, completa Checkout Pro; en local se usa un simulador sin cargos.
3. Configura sedes, servicios, recursos y horarios desde el menú del panel.
4. Personaliza la página en **Diseño** si el plan es PLUS o PREMIUM.
5. Copia el enlace mostrado en el resumen y envíalo al cliente.
6. El cliente abre el enlace y reserva sin iniciar sesión.

La matriz comercial aplicada por el backend es:

- FREE: anuncios discretos durante la reserva y en el panel; sin WhatsApp.
- BASIC: sin anuncios para clientes, anuncio temporal en panel; sin WhatsApp.
- PLUS: sin anuncios; confirmación WhatsApp con consentimiento.
- PREMIUM: confirmación y recordatorio WhatsApp; editor de campañas en `/admin/anuncios`.

La vitrina pública `/anuncios` rota y organiza las campañas activas de empresas Premium.

El access JWT se mantiene solo en memoria. La sesión se recupera mediante un refresh token rotatorio en cookie `HttpOnly`; la API deriva la empresa y los roles, sin confiar en un selector de tenant del navegador.

Para presentación y producción consulta [la guía local](../docs/demo-local.md), [Mercado Pago](../docs/mercado-pago.md) y [Azure](../docs/azure-deployment.md). La variable productiva de build está en [.env.production.example](.env.production.example).

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Estructura

- `src/app`: rutas, layouts y límites de carga/error.
- `src/features`: módulos de autenticación, tenants, branding, publicidad, pagos, catálogo, disponibilidad, reservas y dashboard.
- `src/shared/api`: cliente HTTP y Problem Details.
- `src/shared/components`: componentes reutilizables y providers.
- `src/shared/types`: contratos del dominio.

El panel obtiene la empresa desde la sesión autenticada y no muestra un selector global de tenants.
