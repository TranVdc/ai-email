// api/autinko/callback
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  if (status != "success")
    return NextResponse.json(
      { message: "Failed to link account" },
      { status: 401 },
    );

  const code = params.get("code");
  if (!code)
    return NextResponse.json(
      { message: "Code is not provided" },
      { status: 401 },
    );

  const token = await exchangeCodeForAccessToken(code);

  if (!token)
    return NextResponse.json(
      { message: "Failed to exchange code for access token" },
      { status: 401 },
    );

  const accountDetails = await getAccountDetails(token.accessToken);

  await db.account.upsert({
    where: { id: token.accountId.toString() },
    create: {
      id: token.accountId.toString(),
      userId,
      accessToken: token.accessToken,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
    update: {
      accessToken: token.accessToken,
    },
  });
  console.log(accountDetails);
  return NextResponse.redirect(new URL("/mail", req.url));
};
