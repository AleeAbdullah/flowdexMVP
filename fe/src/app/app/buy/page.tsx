import { redirect } from 'next/navigation';

export default async function ProtectedBuyRoute() {
  redirect('/buy');
}
