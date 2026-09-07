// Lightweight client shim that routes existing `supabase.from(...).select/insert/update` calls
// to internal REST API routes backed by MongoDB. This keeps frontend call-sites
// working while switching the backend storage.

type Result = { data: any; error: any };

function jsonResponse(data: any) {
  return { data, error: null } as Result;
}

function errorResponse(message: string) {
  return { data: null, error: { message } } as Result;
}

export const supabase = {
  from: (table: string) => {
    const state: any = { table };

    function makeSelectBuilder() {
      const builder: any = {
        order(field: string) {
          state.order = field;
          return builder;
        },
        async maybeSingle() {
          try {
            const url = new URL(
              `/api/${table}`,
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000",
            );
            if (state.order) url.searchParams.set("order", state.order);
            const res = await fetch(url.toString());
            if (!res.ok) return errorResponse(await res.text());
            const data = await res.json();
            if (Array.isArray(data)) return jsonResponse(data[0] ?? null);
            return jsonResponse(data);
          } catch (err: any) {
            return errorResponse(String(err?.message ?? err));
          }
        },
        async then(resolve: any, reject: any) {
          try {
            const url = new URL(
              `/api/${table}`,
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000",
            );
            if (state.order) url.searchParams.set("order", state.order);
            const res = await fetch(url.toString());
            if (!res.ok) return reject(await res.text());
            const data = await res.json();
            resolve(jsonResponse(data));
          } catch (err) {
            reject(err);
          }
        },
      };
      return builder;
    }

    return {
      select(_fields = "*") {
        return makeSelectBuilder();
      },
      insert: (payload: any) => {
        return {
          select() {
            return {
              async maybeSingle() {
                try {
                  const res = await fetch(`/api/${table}`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) return errorResponse(await res.text());
                  const data = await res.json();
                  return jsonResponse(data);
                } catch (err: any) {
                  return errorResponse(String(err?.message ?? err));
                }
              },
            };
          },
        };
      },
      update: (payload: any) => {
        return {
          eq: (field: string, value: string) => {
            const executer: any = {
              async perform() {
                try {
                  const res = await fetch(`/api/${table}/${value}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) return errorResponse(await res.text());
                  const data = await res.json();
                  return jsonResponse(data);
                } catch (err: any) {
                  return errorResponse(String(err?.message ?? err));
                }
              },
              select() {
                return {
                  async maybeSingle() {
                    return executer.perform();
                  },
                };
              },
              then(resolve: any, reject: any) {
                executer
                  .perform()
                  .then((r: any) => resolve(r))
                  .catch((e: any) => reject(e));
              },
            };
            return executer;
          },
        };
      },
    };
  },
};
