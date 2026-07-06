"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns a ref that always holds the current auth token.
 *
 * The access token is silently refreshed in the background roughly once an hour
 * (see {@link useAuth}). Listing `token` directly in a `useEffect`/`useCallback`
 * dependency array therefore causes data-fetch effects to re-run on every silent
 * refresh — re-fetching lists, resetting selections, and flickering the UI for no
 * reason.
 *
 * Instead, read `tokenRef.current` inside the effect and keep `token` out of the
 * dependency array. The ref is always up to date, so requests still use a valid
 * token, but the effect only re-runs when its real inputs change.
 *
 * @example
 * const tokenRef = useTokenRef();
 * useEffect(() => {
 *     const token = tokenRef.current;
 *     if (!token) return;
 *     fetchOrders(token, page).then(setOrders);
 * }, [page]); // note: no `token` here
 */
export function useTokenRef(): MutableRefObject<string | null> {
    const { token } = useAuth();
    const tokenRef = useRef(token);
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);
    return tokenRef;
}
