import {expect,test} from "@playwright/test";

test("una empresa se registra, personaliza y abre su enlace público",async({page})=>{
  const suffix=Date.now().toString();const slug=`estudio-${suffix}`;
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Tu tiempo merece/})).toBeVisible();
  await page.getByRole("link",{name:"Crear cuenta"}).click();
  await page.getByLabel("Tu nombre").fill("María Dueña");
  await page.getByLabel("Nombre de la empresa").fill("Estudio Aurora");
  await page.getByLabel("Enlace público").fill(slug);
  await page.getByLabel("Plan").selectOption("PLUS");
  await page.getByLabel("Correo").fill(`${slug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button",{name:"Crear empresa"}).click();
  await expect(page.getByRole("heading",{name:"Completa tu pago"})).toBeVisible();
  await page.getByRole("link",{name:"Ir al checkout seguro"}).click();
  await expect(page.getByRole("heading",{name:"Mercado Pago \(dev\)"})).toBeVisible();
  await page.getByRole("button",{name:"Simular pago aprobado"}).click();
  await expect(page.getByRole("heading",{name:"Buenos días"})).toBeVisible();
  await expect(page.getByText(new RegExp(`/${slug}`))).toBeVisible();

  const menu=page.getByRole("button",{name:"Abrir menú"});if(await menu.isVisible())await menu.click();
  await page.getByRole("link",{name:"Diseño"}).click();
  await page.getByLabel("Título").fill("Reserva en Aurora");
  await page.getByRole("button",{name:"Publicar diseño"}).click();
  await expect(page.getByText("Diseño publicado")).toBeVisible();

  await page.goto(`/${slug}`);
  await expect(page.getByRole("heading",{name:"Reserva en Aurora"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Reservar"})).toBeVisible();
});

test("el propietario cambia de Gratis a Plus después de confirmar el pago",async({page},testInfo)=>{
  const suffix=`${Date.now()}-${testInfo.project.name}`;const slug=`plan-${suffix}`;
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueña de Planes");
  await page.getByLabel("Nombre de la empresa").fill("Negocio Planes");
  await page.getByLabel("Enlace público").fill(slug);
  await page.getByLabel("Plan").selectOption("FREE");
  await page.getByLabel("Correo").fill(`${slug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button",{name:"Crear empresa"}).click();
  await expect(page.getByRole("heading",{name:"Buenos días"})).toBeVisible();

  await page.goto("/admin/plan");
  await expect(page.locator('[aria-current="true"]').getByRole("heading",{name:"Gratis"})).toBeVisible();
  await page.getByRole("button",{name:"Cambiar a Plus"}).click();
  await expect(page.getByRole("heading",{name:"Mercado Pago \(dev\)"})).toBeVisible();
  await page.getByRole("button",{name:"Simular pago aprobado"}).click();
  await expect(page.getByRole("heading",{name:"Elige el plan de tu empresa"})).toBeVisible();
  await expect(page.locator('[aria-current="true"]').getByRole("heading",{name:"Plus"})).toBeVisible();
  await page.goto("/admin/diseno");
  await expect(page.getByRole("button",{name:"Publicar diseño"})).toBeEnabled();
});

test("Premium publica una campaña visible en reservas Free y en la vitrina",async({page},testInfo)=>{
  test.setTimeout(60_000);
  const suffix=`${Date.now()}-${testInfo.project.name}`;const premiumSlug=`premium-${suffix}`;const freeSlug=`free-${suffix}`;const title=`Impulsa tu negocio ${suffix}`;
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueña Premium");
  await page.getByLabel("Nombre de la empresa").fill("Marca Premium");
  await page.getByLabel("Enlace público").fill(premiumSlug);
  await page.getByLabel("Plan").selectOption("PREMIUM");
  await page.getByLabel("Correo").fill(`${premiumSlug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button",{name:"Crear empresa"}).click();
  await page.getByRole("link",{name:"Ir al checkout seguro"}).click();
  await page.getByRole("button",{name:"Simular pago aprobado"}).click();
  await expect(page.getByRole("heading",{name:"Buenos días"})).toBeVisible();

  await page.goto("/admin/anuncios");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Descripción").fill("Servicios pensados para ayudarte a crecer con una experiencia memorable.");
  await page.getByLabel("Texto del botón").fill("Descubrir marca");
  await page.getByLabel("Duración en panel \(5–60 s\)").fill("30");
  await page.getByLabel("URL de destino HTTPS").fill("https://example.com/premium-campaign");
  await page.getByLabel("Publicar campaña al guardar").check();
  await page.getByRole("button",{name:"Guardar campaña"}).click();
  await expect(page.getByText("Campaña publicada")).toBeVisible();

  const logout=await page.request.post("http://localhost:8080/api/v1/auth/logout");
  expect(logout.ok()).toBeTruthy();
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueño Free");
  await page.getByLabel("Nombre de la empresa").fill("Agenda Free");
  await page.getByLabel("Enlace público").fill(freeSlug);
  await page.getByLabel("Plan").selectOption("FREE");
  await page.getByLabel("Correo").fill(`${freeSlug}@example.test`);
  await page.getByLabel("Contraseña").fill("secret123");
  await page.getByRole("button",{name:"Crear empresa"}).click();
  await expect(page.getByLabel(/Publicidad de/)).toBeVisible();

  await page.goto(`/${freeSlug}/reservar`);
  await expect(page.getByLabel(/Publicidad de/)).toBeVisible();
  await expect(page.getByText("Recibir por WhatsApp")).toHaveCount(0);
  await page.goto("/anuncios");
  await expect(page.getByRole("heading",{name:/Descubre empresas/})).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
});
