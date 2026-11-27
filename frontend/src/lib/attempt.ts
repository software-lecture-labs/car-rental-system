/** Sunucu bileşenlerinde veri çağrısını hata fırlatmadan sonuç nesnesine çevirir. */
export type Attempt<T> = { ok: true; data: T } | { ok: false; error: unknown };

export async function attempt<T>(promise: Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    return { ok: false, error };
  }
}
