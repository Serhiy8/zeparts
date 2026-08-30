"use client";

import { useState } from "react";

type Client = {
  id: number;
  name: string;
  address: string;
};

const clients: Client[] = [
  {
    id: 1,
    name: "Auto Parts AB",
    address: "Göteborgsvägen 12, Göteborg",
  },
  {
    id: 2,
    name: "Eriksson Bil",
    address: "Storgatan 25, Göteborg",
  },
  {
    id: 3,
    name: "Göteborgs Bildelar",
    address: "Industrigatan 8, Göteborg",
  },
  {
    id: 4,
    name: "Nordic Car Parts",
    address: "Exportgatan 15, Göteborg",
  },
  {
    id: 5,
    name: "Svenska Bilservice",
    address: "Mölndalsvägen 42, Göteborg",
  },
  {
    id: 6,
    name: "Mekonomen",
    address: "Backavägen 20, Göteborg",
  },
  {
    id: 7,
    name: "BilXtra",
    address: "Ringögatan 12, Göteborg",
  },
  {
    id: 8,
    name: "Carfix",
    address: "Hisingen 14, Göteborg",
  },
];

export default function Dashboard() {
  const [page, setPage] = useState<"clients" | "route">("clients");

  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  const [completedClients, setCompletedClients] = useState<number[]>([]);

  const toggleClient = (id: number) => {
    setSelectedClients((current) =>
      current.includes(id)
        ? current.filter((clientId) => clientId !== id)
        : [...current, id],
    );
  };

  const toggleCompleted = (id: number) => {
    setCompletedClients((current) =>
      current.includes(id)
        ? current.filter((clientId) => clientId !== id)
        : [...current, id],
    );
  };

  const routeClients = selectedClients
    .map((id) => clients.find((client) => client.id === id))
    .filter(Boolean) as Client[];

  const openLocation = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;

    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto min-h-screen w-full max-w-[480px] bg-white pb-20">
        {/* HEADER */}
        <header className="border-b border-gray-200 px-4 py-5">
          {page === "clients" ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Клієнти</h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Оберіть клієнтів для маршруту
                  </p>
                </div>

                {selectedClients.length > 0 && (
                  <div className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold">
                    {selectedClients.length}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Мій маршрут
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    {routeClients.length}{" "}
                    {routeClients.length === 1 ? "точка" : "точок"}
                  </p>
                </div>

                {routeClients.length > 0 && (
                  <div className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold">
                    {
                      completedClients.filter((id) =>
                        selectedClients.includes(id),
                      ).length
                    }
                    /{routeClients.length}
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        {/* CONTENT */}
        <section className="px-4 py-4">
          {page === "clients" ? (
            /* ---------------- CLIENTS ---------------- */
            <div className="space-y-2">
              {clients.map((client) => {
                const isSelected = selectedClients.includes(client.id);

                return (
                  <div
                    key={client.id}
                    className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span
                      className={`text-base font-medium ${
                        isSelected ? "text-green-800" : "text-gray-900"
                      }`}
                    >
                      {client.name}
                    </span>

                    <button
                      onClick={() => toggleClient(client.id)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                        isSelected
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isSelected ? (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ---------------- ROUTE ---------------- */
            <>
              {routeClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                    🚚
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Маршрут порожній
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Перейдіть у «Клієнти» та додайте точки до маршруту.
                  </p>

                  <button
                    onClick={() => setPage("clients")}
                    className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
                  >
                    Перейти до клієнтів
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {routeClients.map((client, index) => {
                    const isCompleted = completedClients.includes(client.id);

                    return (
                      <div
                        key={client.id}
                        className={`rounded-xl border p-4 transition ${
                          isCompleted
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Client name */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isCompleted ? "✓" : index + 1}
                          </div>

                          <span
                            className={`font-semibold ${
                              isCompleted
                                ? "text-green-800 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {client.name}
                          </span>
                        </div>

                        {/* Buttons */}
                        {!isCompleted ? (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openLocation(client.address)}
                              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 active:scale-[0.98]"
                            >
                              <span>📍</span>
                              Розташування
                            </button>

                            <button
                              onClick={() => toggleCompleted(client.id)}
                              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-medium text-white active:scale-[0.98]"
                            >
                              <span>✓</span>
                              Виконано
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleCompleted(client.id)}
                            className="mt-4 h-11 w-full rounded-xl border border-green-200 bg-white text-sm font-medium text-green-700"
                          >
                            Скасувати виконання
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* BOTTOM NAVIGATION */}
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-gray-200 bg-white">
          <div className="grid grid-cols-2">
            {/* CLIENTS */}
            <button
              onClick={() => setPage("clients")}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                page === "clients" ? "text-black" : "text-gray-400"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Клієнти
            </button>

            {/* ROUTE */}
            <button
              onClick={() => setPage("route")}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                page === "route" ? "text-black" : "text-gray-400"
              }`}
            >
              {selectedClients.length > 0 && (
                <span className="absolute right-[calc(50%-25px)] top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
                  {selectedClients.length}
                </span>
              )}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
              Маршрут
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
