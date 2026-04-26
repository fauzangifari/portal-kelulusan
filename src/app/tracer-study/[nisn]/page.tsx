import TracerForm from "./tracer-form";

export const metadata = {
  title: "Tracer Study | SMA Negeri 1 Samarinda",
};

export default async function TracerStudyPage({ params }: { params: Promise<{ nisn: string }> }) {
  const { nisn } = await params;
  return <TracerForm nisn={nisn} />;
}
