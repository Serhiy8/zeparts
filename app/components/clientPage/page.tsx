"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Client = {
  id: string;
  name: string;
  google_maps_url: string;
  position: number;
};

type RouteStop = {
  id: string;
  client_id: string;
  position: number;
  status: "pending" | "completed";
};

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // -----------------------------
        // LOAD CLIENTS
        // -----------------------------

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, google_maps_url, position")
          .order("position", {
            ascending: true,
          });

        if (clientsError) {
          throw clientsError;
        }

        setClients(clientsData || []);

        // -----------------------------
        // LOAD TODAY'S ROUTE
        // -----------------------------

        const today = new Date().toLocaleDateString("sv-SE");

        const { data: routes, error: routeError } = await supabase
          .from("routes")
          .select("id")
          .eq("route_date", today)
          .order("created_at", {
            ascending: true,
          })
          .limit(1);

        if (routeError) {
          throw routeError;
        }

        const route = routes?.[0];

        // Немає маршруту — це нормально.
        // Нічого не створюємо.
        if (!route) {
          setRouteStops([]);
          return;
        }

        // -----------------------------
        // LOAD ROUTE STOPS
        // -----------------------------

        const { data: stops, error: stopsError } = await supabase
          .from("route_stops")
          .select("id, client_id, position, status")
          .eq("route_id", route.id)
          .order("position", {
            ascending: true,
          });

        if (stopsError) {
          throw stopsError;
        }

        setRouteStops(stops || []);
      } catch (err) {
        console.error("LOAD DATA ERROR:", err);

        setError(
          err instanceof Error ? err.message : "Не вдалося завантажити дані",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================================================
  // ADD CLIENT TO ROUTE
  // =========================================================

  const addToRoute = async (clientId: string) => {
    try {
      setAddingId(clientId);
      setError(null);

      const today = new Date().toLocaleDateString("sv-SE");

      // -----------------------------------------------------
      // 1. ЗНАХОДИМО СЬОГОДНІШНІЙ МАРШРУТ
      // -----------------------------------------------------

      const { data: existingRoutes, error: findRouteError } = await supabase
        .from("routes")
        .select("id")
        .eq("route_date", today)
        .order("created_at", {
          ascending: true,
        })
        .limit(1);

      if (findRouteError) {
        throw findRouteError;
      }

      let routeId = existingRoutes?.[0]?.id;

      // -----------------------------------------------------
      // 2. ЯКЩО МАРШРУТУ НЕМАЄ — СТВОРЮЄМО
      // -----------------------------------------------------

      if (!routeId) {
        const { data: newRoute, error: createRouteError } = await supabase
          .from("routes")
          .upsert(
            {
              route_date: today,
              status: "planned",
            },
            {
              onConflict: "route_date",
              ignoreDuplicates: true,
            },
          )
          .select("id")
          .maybeSingle();

        if (createRouteError) {
          throw createRouteError;
        }

        routeId = newRoute?.id;

        // upsert з ignoreDuplicates може
        // нічого не повернути — тоді знаходимо
        // вже існуючий маршрут
        if (!routeId) {
          const { data: routeAfterUpsert, error: routeAfterUpsertError } =
            await supabase
              .from("routes")
              .select("id")
              .eq("route_date", today)
              .single();

          if (routeAfterUpsertError) {
            throw routeAfterUpsertError;
          }

          routeId = routeAfterUpsert.id;
        }
      }

      // -----------------------------------------------------
      // 3. ПЕРЕВІРЯЄМО ЧИ КЛІЄНТ ВЖЕ Є
      // -----------------------------------------------------

      const { data: existingStop, error: existingStopError } = await supabase
        .from("route_stops")
        .select("id, client_id, position, status")
        .eq("route_id", routeId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (existingStopError) {
        throw existingStopError;
      }

      // Вже є — нічого не робимо
      if (existingStop) {
        setRouteStops((current) => {
          const exists = current.some((stop) => stop.id === existingStop.id);

          if (exists) {
            return current;
          }

          return [...current, existingStop];
        });

        return;
      }

      // -----------------------------------------------------
      // 4. ЗНАХОДИМО НАСТУПНУ ПОЗИЦІЮ
      // -----------------------------------------------------

      const { error: lastStopError } = await supabase
        .from("route_stops")
        .select("position")
        .eq("route_id", routeId)
        .order("position", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (lastStopError) {
        throw lastStopError;
      }

      const client = clients.find((item) => item.id === clientId);

      if (!client) {
        throw new Error("Клієнт не знайдений");
      }

      // -----------------------------------------------------
      // 5. ДОДАЄМО КЛІЄНТА
      // -----------------------------------------------------

      const { data: newStop, error: addStopError } = await supabase
        .from("route_stops")
        .insert({
          route_id: routeId,
          client_id: clientId,
          position: client.position,
          status: "pending",
          completed_at: null,
        })
        .select("id, client_id, position, status")
        .single();

      if (addStopError) {
        throw addStopError;
      }

      // -----------------------------------------------------
      // 6. ОНОВЛЮЄМО UI
      // -----------------------------------------------------

      setRouteStops((current) => [...current, newStop]);
    } catch (err) {
      console.error("ADD TO ROUTE ERROR:", err);

      setError(
        err instanceof Error ? err.message : "Не вдалося додати клієнта",
      );
    } finally {
      setAddingId(null);
    }
  };

  // =========================================================
  // REMOVE CLIENT FROM ROUTE
  // =========================================================

  const removeFromRoute = async (clientId: string) => {
    try {
      const stop = routeStops.find((item) => item.client_id === clientId);

      if (!stop) {
        return;
      }

      const { error } = await supabase
        .from("route_stops")
        .delete()
        .eq("id", stop.id);

      if (error) {
        throw error;
      }

      setRouteStops((current) =>
        current
          .filter((item) => item.id !== stop.id)
          .map((item, index) => ({
            ...item,
            position: index + 1,
          })),
      );
    } catch (err) {
      console.error("REMOVE FROM ROUTE ERROR:", err);

      setError(
        err instanceof Error ? err.message : "Не вдалося видалити клієнта",
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto min-h-screen w-full max-w-120 bg-white p-5">
          <div className="flex min-h-[80vh] items-center justify-center text-gray-500">
            Завантаження...
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto min-h-screen w-full max-w-120 bg-white pb-20">
        {/* HEADER */}

        <header className="border-b border-gray-200 px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Клієнти</h1>

              <p className="mt-1 text-sm text-gray-500">
                Всього: {clients.length}
              </p>
            </div>

            {routeStops.length > 0 && (
              <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-green-100 px-3 text-sm font-bold text-green-700">
                {routeStops.length}
              </div>
            )}
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mx-4 mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* CLIENT LIST */}

        <section className="px-4 py-4">
          {clients.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl">👥</div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Клієнтів немає
              </h2>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const stop = routeStops.find(
                  (item) => item.client_id === client.id,
                );

                const selected = !!stop;

                const adding = addingId === client.id;

                return (
                  <div
                    key={client.id}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      border
                      px-4
                      py-3
                      transition
                      ${
                        selected
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-white"
                      }
                    `}
                  >
                    {/* CLIENT NAME */}{" "}
                    <div className="min-w-0 flex-1">
                      {" "}
                      <p
                        className={` truncate text-base font-semibold ${selected ? "text-green-800" : "text-gray-900"} `}
                      >
                        {" "}
                        {client.name}{" "}
                      </p>{" "}
                      {selected && (
                        <p className="mt-0.5 text-xs text-green-600">
                          {" "}
                          №{" "}
                          {routeStops
                            .slice()
                            .sort((a, b) => a.position - b.position)
                            .findIndex((stop) => stop.client_id === client.id) +
                            1}{" "}
                          у маршруті{" "}
                        </p>
                      )}{" "}
                    </div>
                    {/* BUTTON */}
                    {selected ? (
                      <button
                        type="button"
                        onClick={() => removeFromRoute(client.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-xl font-bold text-white transition active:scale-95"
                        aria-label="Видалити з маршруту"
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToRoute(client.id)}
                        disabled={adding}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-2xl font-light text-white transition active:scale-95 disabled:opacity-50"
                        aria-label="Додати до маршруту"
                      >
                        {adding ? "…" : "+"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BOTTOM NAVIGATION */}

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-120 -translate-x-1/2 border-t border-gray-200 bg-white">
          <div className="grid grid-cols-2">
            {/* CLIENTS */}

            <Link
              href="/components/clientPage"
              className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-black"
            >
              <span className="text-xl">👥</span>
              Клієнти
            </Link>

            {/* ROUTE */}

            <Link
              href="/components/routePage"
              className="relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-gray-400"
            >
              {routeStops.length > 0 && (
                <span className="absolute right-[calc(50%-25px)] top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
                  {routeStops.length}
                </span>
              )}
              <span className="text-xl">🚚</span>
              Маршрут
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
