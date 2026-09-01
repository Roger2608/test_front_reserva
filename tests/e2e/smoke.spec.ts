import { expect, test } from "@playwright/test";

test("comunica la prueba gratis en el inicio y en el registro", async ({
  page,
}) => {
  await page.goto("/");
  const promotion = page.getByRole("dialog", {
    name: /Elige cualquier plan y úsalo gratis por 15 días/,
  });
  await expect(promotion).toBeVisible();
  await expect(promotion.getByText("Sin cobro inicial")).toBeVisible();
  await promotion.getByRole("link", { name: "Comenzar mis 15 días" }).click();
  await expect(page).toHaveURL(/\/registro$/);
  await expect(
    page.getByRole("note", { name: "Beneficio de prueba gratis" }),
  ).toContainText("Basic, Plus y Premium: 15 días gratis");
});

test("una empresa se registra, personaliza y abre su enlace público", async ({
  page,
}, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const slug = `estudio-${suffix}`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Una página de reservas que se siente realmente tuya/,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Crear cuenta" }).click();
  await page.getByLabel("Tu nombre").fill("María Dueña");
  await page.getByLabel("Nombre de la empresa").fill("Estudio Aurora");
  await page.getByLabel("Enlace público").fill(slug);
  await page.getByLabel("Plan").selectOption("PLUS");
  await page.getByLabel("Correo").fill(`${slug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(
    page.getByRole("heading", { name: "Buenos días" }),
  ).toBeVisible();
  await expect(page.getByText(/días de prueba disponibles/)).toBeVisible();
  await expect(page.getByText(new RegExp(`/${slug}`))).toBeVisible();

  const menu = page.getByRole("button", { name: "Abrir menú" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Diseño" }).click();
  await page.getByLabel("Título").fill("Reserva en Aurora");
  await page.getByLabel("Fondo de la página").selectOption("COLOR");
  await page.getByLabel("Color de fondo").fill("#e6fffb");
  await page.getByRole("button", { name: "Publicar diseño" }).click();
  await expect(page.getByText("Diseño publicado")).toBeVisible();

  await page.goto(`/${slug}`);
  await expect(
    page.getByRole("heading", { name: "Reserva en Aurora" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Reservar" })).toBeVisible();
});

test("el propietario cambia de Gratis a Plus después de confirmar el pago", async ({
  page,
}, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const slug = `plan-${suffix}`;
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueña de Planes");
  await page.getByLabel("Nombre de la empresa").fill("Negocio Planes");
  await page.getByLabel("Enlace público").fill(slug);
  await page.getByLabel("Plan").selectOption("FREE");
  await page.getByLabel("Correo").fill(`${slug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(
    page.getByRole("heading", { name: "Buenos días" }),
  ).toBeVisible();

  await page.goto("/admin/plan");
  await expect(
    page
      .locator('[aria-current="true"]')
      .getByRole("heading", { name: "Gratis" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cambiar a Plus" }).click();
  await expect(
    page.getByRole("heading", { name: "Mercado Pago \(dev\)" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(
    page.getByRole("heading", { name: "Elige el plan de tu empresa" }),
  ).toBeVisible();
  await expect(
    page
      .locator('[aria-current="true"]')
      .getByRole("heading", { name: "Plus" }),
  ).toBeVisible();
  await page.goto("/admin/diseno");
  await expect(
    page.getByRole("button", { name: "Publicar diseño" }),
  ).toBeEnabled();
});

test("Premium publica una campaña visible en reservas Free y en la vitrina", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const premiumSlug = `premium-${suffix}`;
  const freeSlug = `free-${suffix}`;
  const title = `Impulsa tu negocio ${suffix}`;
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueña Premium");
  await page.getByLabel("Nombre de la empresa").fill("Marca Premium");
  await page.getByLabel("Enlace público").fill(premiumSlug);
  await page.getByLabel("Plan").selectOption("PREMIUM");
  await page.getByLabel("Correo").fill(`${premiumSlug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(
    page.getByRole("heading", { name: "Buenos días" }),
  ).toBeVisible();

  await page.goto("/admin/anuncios");
  await page.getByLabel("Título").fill(title);
  await page
    .getByLabel("Descripción")
    .fill(
      "Servicios pensados para ayudarte a crecer con una experiencia memorable.",
    );
  await page.getByLabel("Texto del botón").fill("Descubrir marca");
  await page.getByLabel("Duración en panel").fill("30");
  await page
    .getByLabel("URL de destino HTTPS")
    .fill("https://example.com/premium-campaign");
  await page.getByLabel("Publicar al guardar").check();
  await page.getByRole("button", { name: "Guardar campaña" }).click();
  await expect(page.getByText("Campaña publicada")).toBeVisible();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  const logout = await page.request.post(`${apiUrl}/api/v1/auth/logout`);
  expect(logout.ok()).toBeTruthy();
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueño Free");
  await page.getByLabel("Nombre de la empresa").fill("Agenda Free");
  await page.getByLabel("Enlace público").fill(freeSlug);
  await page.getByLabel("Plan").selectOption("FREE");
  await page.getByLabel("Correo").fill(`${freeSlug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByLabel(/Publicidad de/)).toBeVisible();

  await page.goto(`/${freeSlug}/reservar`);
  await expect(page.getByLabel(/Publicidad de/)).toBeVisible();
  await expect(page.getByText("Recibir por WhatsApp")).toHaveCount(0);
  await page.goto("/anuncios");
  await expect(
    page.getByRole("heading", { name: /Descubre empresas/ }),
  ).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
});

test("configura sede, servicio, personal y horario; el cliente reserva y la empresa completa la cita", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}-${testInfo.project.name}`;
  const slug = `agenda-${suffix}`;
  const location = `Sede Central ${suffix}`;
  const service = `Consulta integral ${suffix}`;
  const staff = `Andrea ${suffix}`;

  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueña Agenda");
  await page.getByLabel("Nombre de la empresa").fill("Agenda Integral");
  await page.getByLabel("Enlace público").fill(slug);
  await page.getByLabel("Plan").selectOption("PLUS");
  await page.getByLabel("Correo").fill(`${slug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button", { name: "Crear empresa" }).click();
  await expect(page.getByRole("heading", { name: "Buenos días" })).toBeVisible();

  await page.goto("/admin/locations");
  await page.getByLabel("Nombre").fill(location);
  await page.getByLabel("Dirección").fill("Av. Pruebas 123");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado correctamente")).toBeVisible();
  await expect(page.getByText(location)).toBeVisible();

  await page.goto("/admin/services");
  await page.getByLabel("Nombre").fill(service);
  await page.getByLabel("Descripción").fill("Atención creada por la prueba integral");
  await page.getByLabel("Duración (min)").fill("30");
  await page.getByLabel("Precio").fill("80");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado correctamente")).toBeVisible();
  await expect(page.getByText(service)).toBeVisible();

  await page.goto("/admin/resources");
  await page.getByLabel("Nombre").fill(staff);
  await page.getByLabel("Sede").selectOption({ label: location });
  await page.getByLabel("Tipo").selectOption("STAFF");
  await page.getByLabel("Presentación breve").fill("Especialista en atención integral");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado correctamente")).toBeVisible();
  await expect(page.getByText(staff)).toBeVisible();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();
  await page.goto("/admin/availability");
  await page.getByLabel("Recurso").selectOption({ label: staff });
  await page.getByLabel("Día").selectOption(String(day));
  await page.getByLabel("Desde").fill("09:00");
  await page.getByLabel("Hasta").fill("12:00");
  await page.getByRole("button", { name: "Guardar horario" }).click();
  await expect(page.getByText("Horario guardado")).toBeVisible();
  await expect(page.getByText(/09:00–12:00/)).toBeVisible();

  await page.goto(`/${slug}/reservar`);
  await page.getByLabel("Servicio").selectOption({ label: `${service} · 30 min` });
  await page.getByLabel("Sede").selectOption({ label: location });
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByRole("button", { name: new RegExp(staff) }).click();
  const firstSlot = page.locator("button").filter({ hasText: /^09:/ }).first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByLabel("Nombre completo").fill("Cliente E2E");
  await page.getByLabel("Teléfono").fill("51958632441");
  await page.getByLabel("Correo (opcional)").fill(`cliente-${suffix}@example.test`);
  await page.getByRole("checkbox", { name: /Recibir por WhatsApp/ }).check();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByRole("heading", { name: "¡Todo listo!" })).toBeVisible();
  await expect(page.getByText("Reserva recibida")).toBeVisible();

  await page.goto("/admin/bookings");
  const booking = page.locator("tbody tr").first();
  await expect(booking).toContainText("PENDING");
  await booking.getByRole("button", { name: "Confirmar" }).click();
  await expect(booking).toContainText("CONFIRMED");
  await booking.getByRole("button", { name: "Completar" }).click();
  await expect(booking).toContainText("COMPLETED");
});
