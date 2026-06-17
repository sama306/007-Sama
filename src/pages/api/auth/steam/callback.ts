import type { APIRoute } from 'astro'
import { encode } from '@auth/core/jwt'

export const prerender = false

interface SteamProfile {
  steamid: string
  personaname: string
  avatarfull: string
  profileurl: string
}

export const GET: APIRoute = async ({ url, cookies, redirect: astroRedirect }) => {
  const realm = import.meta.env.AUTH_URL ?? 'http://localhost:4321'
  const steamKey = import.meta.env.AUTH_STEAM_KEY
  const returnTo = `${realm}/api/auth/steam/callback`

  const params = Object.fromEntries(url.searchParams)

  if (params['openid.mode'] !== 'id_res') {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }

  if (params['openid.return_to'] !== returnTo) {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }

  if (!params['openid.claimed_id']?.startsWith('https://steamcommunity.com/openid/id/')) {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }

  if (
    !params['openid.op_endpoint'] ||
    !params['openid.op_endpoint'].startsWith('https://steamcommunity.com/openid/login')
  ) {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }

  const verifyParams = new URLSearchParams({
    'openid.assoc_handle': params['openid.assoc_handle'] || '',
    'openid.signed': params['openid.signed'] || '',
    'openid.sig': params['openid.sig'] || '',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'check_authentication',
  })

  for (const key of (params['openid.signed'] || '').split(',')) {
    const signedKey = `openid.${key}`
    if (params[signedKey]) {
      verifyParams.set(signedKey, params[signedKey])
    }
  }

  const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })

  const verifyText = await verifyRes.text()

  if (!verifyText.includes('is_valid:true')) {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }

  const steamIdMatch = params['openid.claimed_id']?.match(/\/id\/(\d+)$/)
  if (!steamIdMatch) {
    return astroRedirect('/auth/error?error=SteamAuthFailed')
  }
  const steamId = steamIdMatch[1]

  let profile: SteamProfile | null = null
  if (steamKey) {
    try {
      const profileRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&steamids=${steamId}`,
      )
      const profileJson = (await profileRes.json()) as { response: { players: SteamProfile[] } }
      profile = profileJson.response.players[0] || null
    } catch {}
  }

  const secret = import.meta.env.AUTH_SECRET
  if (!secret) {
    return astroRedirect('/auth/error?error=Configuration')
  }

  const useSecure = realm.startsWith('https')
  const cookiePrefix = useSecure ? '__Secure-' : ''
  const maxAge = 30 * 24 * 60 * 60

  const token = {
    name: profile?.personaname || `Steam_${steamId}`,
    email: `${steamId}@steam.local`,
    picture: profile?.avatarfull || null,
    sub: steamId,
    id: steamId,
    role: 'user',
  }

  const jwtToken = await encode({
    token,
    secret,
    salt: `${cookiePrefix}authjs.session-token`,
    maxAge,
  })

  cookies.set(`${cookiePrefix}authjs.session-token`, jwtToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecure,
    maxAge,
  })

  return astroRedirect('/account')
}
