export async function getHomeBanners() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || String(base).trim() === "") {
    return {
      ok: false,
      items: [],
      status: 0,
      message: "NEXT_PUBLIC_API_URL is not set",
    };
  }

  const url = `${String(base).replace(/\/$/, "")}/banner/home-banners`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      let message = `Server error (${response.status})`;
      try {
        const errBody = await response.json();
        if (errBody?.message) {
          message = String(errBody.message);
        }
      } catch {
        /* ignore non-JSON error body */
      }
      return {
        ok: false,
        items: [],
        status: response.status,
        message,
      };
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    return {
      ok: true,
      items,
      status: response.status,
      message: "",
    };
  } catch (e) {
    return {
      ok: false,
      items: [],
      status: 0,
      message:
        e instanceof Error
          ? e.message
          : "Failed to load home banners",
    };
  }
}
