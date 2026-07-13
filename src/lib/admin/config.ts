export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "ricpadua556@gmail.com").trim().toLowerCase();
}

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

export function getAdminSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret || null;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAdminPassword() && getAdminSessionSecret());
}
