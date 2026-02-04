// app/classes/[classId]/page.tsx
import React from 'react';

interface Props {
  params: { classId: string };
}

export default function ClassPage({ params }: Props) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Lớp: {params.classId}</h1>
      <p className="text-gray-600 mt-2">Trang tạm thời cho chi tiết lớp.</p>
    </div>
  );
}