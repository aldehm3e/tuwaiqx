import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { corsHeaders } from "@/src/lib/api/cors";
import { prisma } from "@/src/lib/db/prisma";

export async function OPTIONS(request: Request) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    include: { fields: true }
  });
  if (!form?.isActive) {
    return NextResponse.json({ error: "Form not found." }, { status: 404, headers });
  }

  const payload = z.record(z.unknown()).parse(await request.json());
  for (const field of form.fields) {
    if (field.required && !payload[field.name]) {
      return NextResponse.json({ error: `${field.label} is required.` }, { status: 422, headers });
    }
  }
  const submission = await prisma.formSubmission.create({
    data: { formId: form.id, dataJson: payload as Prisma.InputJsonObject }
  });
  return NextResponse.json({ message: "Submission saved.", id: submission.id }, { headers });
}
