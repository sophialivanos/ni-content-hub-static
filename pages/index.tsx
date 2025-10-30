import Layout from "@/components/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Welcome to your content hub!
        </h1>
        <p className="text-slate-600 mt-2">
          Create, optimise, and brainstorm content. Use the sidebar to navigate.
        </p>
      </div>
    </Layout>
  );
}
