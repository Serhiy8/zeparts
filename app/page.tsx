import ClientsPage from "./components/clientPage/page";
import RootLayout from "./layout";

export default function Home({ params }: { params: Promise<object> }) {
  return (
    <RootLayout params={params}>
      <ClientsPage />
    </RootLayout>
  );
}
