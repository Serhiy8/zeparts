"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type RouteClient = {
  id: string;
  client_id: string;
  position: number;
  status: "pending" | "completed";
  completed_at: string | null;

  client: {
    name: string;
    google_maps_url: string;
  };
};

export default function RoutePage() {
  const [routeClients, setRouteClients] = useState<RouteClient[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // LOAD ROUTE
  // =========================================================

  useEffect(() => {
    const loadRoute = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toLocaleDateString("sv-SE");

        // -----------------------------------------------------
        // ЗНАХОДИМО СЬОГОДНІШНІЙ МАРШРУТ
        // -----------------------------------------------------

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

        // ВАЖЛИВО:
        // якщо маршруту немає — НЕ СТВОРЮЄМО ЙОГО

        if (!route) {
          setRouteClients([]);
          return;
        }

        // -----------------------------------------------------
        // ЗАВАНТАЖУЄМО КЛІЄНТІВ МАРШРУТУ
        // -----------------------------------------------------

        const { data, error: stopsError } = await supabase
          .from("route_stops")
          .select(
            `
            id,
            client_id,
            position,
            status,
            completed_at,
            client:clients (
              name,
              google_maps_url
            )
          `,
          )
          .eq("route_id", route.id)
          .order("position", {
            ascending: true,
          });

        if (stopsError) {
          throw stopsError;
        }

        setRouteClients((data as unknown as RouteClient[]) || []);
      } catch (err) {
        console.error("LOAD ROUTE ERROR:", err);

        setError(
          err instanceof Error ? err.message : "Не вдалося завантажити маршрут",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, []);

  // =========================================================
  // TOGGLE COMPLETED
  // =========================================================

  const toggleCompleted = async (stop: RouteClient) => {
    try {
      const completed = stop.status === "completed";

      const newStatus = completed ? "pending" : "completed";

      const completedAt = completed ? null : new Date().toISOString();

      const { error: updateError } = await supabase
        .from("route_stops")
        .update({
          status: newStatus,
          completed_at: completedAt,
        })
        .eq("id", stop.id);

      if (updateError) {
        throw updateError;
      }

      setRouteClients((current) =>
        current.map((item) =>
          item.id === stop.id
            ? {
                ...item,
                status: newStatus,
                completed_at: completedAt,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error("COMPLETE ERROR:", err);

      setError(
        err instanceof Error ? err.message : "Не вдалося змінити статус",
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
  // COMPLETED COUNT
  // =========================================================

  const completedCount = routeClients.filter(
    (client) => client.status === "completed",
  ).length;

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
              <h1 className="text-2xl font-bold text-gray-900">Мій маршрут</h1>

              <p className="mt-1 text-sm text-gray-500">
                {completedCount} з {routeClients.length} виконано
              </p>
            </div>

            <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-gray-100 px-3 text-sm font-bold text-gray-700">
              {routeClients.length}
            </div>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mx-4 mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ROUTE */}

        <section className="px-4 py-4">
          {routeClients.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl">🚚</div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Маршрут порожній
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Перейдіть у «Клієнти» та додайте потрібних клієнтів до маршруту.
              </p>

              <Link
                href="/components/clientPage"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gray-900 px-6 text-sm font-semibold text-white"
              >
                До клієнтів
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {routeClients.map((stop) => {
                const completed = stop.status === "completed";

                return (
                  <div
                    key={stop.id}
                    className={`
                        rounded-xl
                        border
                        p-4
                        transition
                        ${
                          completed
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white"
                        }
                      `}
                  >
                    {/* CLIENT */}

                    <div className="flex items-center gap-3">
                      {/* POSITION */}

                      <div
                        className={`
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            text-sm
                            font-bold
                            ${
                              completed
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-700"
                            }
                          `}
                      >
                        {completed ? "✓" : stop.position}
                      </div>

                      {/* NAME */}

                      <div className="min-w-0 flex-1">
                        <h2
                          className={`
                              text-base
                              font-semibold
                              ${
                                completed
                                  ? "text-green-800 line-through"
                                  : "text-gray-900"
                              }
                            `}
                        >
                          {stop.client.name}
                        </h2>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {/* GOOGLE MAPS */}

                      <a
                        href={stop.client.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-800 transition active:scale-[0.98]"
                      >
                        📍 Розташування
                      </a>

                      {/* COMPLETED */}

                      <button
                        type="button"
                        onClick={() => toggleCompleted(stop)}
                        className={`
                            h-11
                            rounded-lg
                            text-sm
                            font-semibold
                            transition
                            active:scale-[0.98]
                            ${
                              completed
                                ? "bg-green-500 text-white"
                                : "bg-gray-900 text-white"
                            }
                          `}
                      >
                        {completed ? "✓ Виконано" : "Виконано"}
                      </button>
                    </div>
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
              className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-gray-400"
            >
              <span className="text-xl">👥</span>
              Клієнти
            </Link>

            {/* ROUTE */}

            <Link
              href="/components/routePage"
              className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-black"
            >
              <span className="text-xl">🚚</span>
              Маршрут
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
