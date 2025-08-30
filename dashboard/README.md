# Dashboard UI • Retos Diarios (Mock)

Paquete estático (HTML/CSS/JS puro) que maqueta un dashboard industrial oscuro
sin tocar tu backend. Incluye:

- Sidebar jerarquizado
- Topbar con búsqueda, notificaciones y perfil admin
- KPIs en tarjetas (usuarios activos, promociones, premium, retos)
- Gráfico SVG sin dependencias (evolución en el tiempo)
- Tabla de usuarios con búsqueda y filtros (all/active/promo/premium)
- Diseño responsive y accesible con paleta oscura

## Uso

1. Descomprime y abre `index.html` en el navegador.
2. Los datos son _mock_ (no conectan al backend); se regeneran y simulan tiempo real.
3. Reemplaza el mock por tus endpoints cuando quieras integrar.

## Integración (opcional, cuando el backend esté listo)

- Reemplaza generadores `genUsers()` y `genSeries()` por `fetch()` a tus APIs.
- Pinta el gráfico actual alimentando `state.series` con tus series reales.
