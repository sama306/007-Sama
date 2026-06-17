import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ redirect }) => {
  const realm = import.meta.env.AUTH_URL ?? 'http://localhost:4321'
  const returnTo = `${realm}/api/auth/steam/callback`

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  return redirect(`https://steamcommunity.com/openid/login?${params.toString()}`)
}
