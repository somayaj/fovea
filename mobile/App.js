import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const PAPER = "#f9f6ee";

function configuredOrigin() {
  return String(process.env.EXPO_PUBLIC_FOVEA_URL || "").trim().replace(/\/$/, "");
}

function withMobileParam(url) {
  if (!url) return url;
  return url.includes("?") ? `${url}&mobile=1` : `${url}?mobile=1`;
}

function isPhoneUnreachableHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1"
  );
}

/** Google OAuth sends the WebView back to localhost; rewrite onto the public tunnel. */
function rewriteDevCallback(url, publicOrigin) {
  if (!url || !publicOrigin) return url;
  try {
    const parsed = new URL(url);
    if (!isPhoneUnreachableHost(parsed.hostname)) return url;
    const next = new URL(publicOrigin);
    next.pathname = parsed.pathname;
    next.search = parsed.search;
    next.hash = parsed.hash;
    if (next.pathname === "/" && !next.searchParams.has("mobile")) {
      next.searchParams.set("mobile", "1");
    }
    return next.toString();
  } catch {
    return url;
  }
}

/** Dev URL for the Vite client. Simulator uses localhost; device uses LAN IP via Expo host. */
function resolveAppUrl() {
  const configured = configuredOrigin();
  if (configured) return withMobileParam(configured);

  const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (expoHost && expoHost !== "localhost" && expoHost !== "127.0.0.1") {
    return withMobileParam(`http://${expoHost}:5173`);
  }

  return withMobileParam("http://localhost:5173");
}

const MOBILE_SHELL_SCRIPT = `
  window.fovea = Object.assign({}, window.fovea, {
    isMobileShell: true,
    platform: "${Platform.OS}",
  });
  true;
`;

export default function App() {
  const publicOrigin = useMemo(() => configuredOrigin(), []);
  const initialUrl = useMemo(() => resolveAppUrl(), []);
  const [uri, setUri] = useState(initialUrl);
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const openUrl = (next) => {
    if (!next || next === uri) return;
    setLoading(true);
    setUri(next);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <WebView
          ref={webRef}
          source={{ uri }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={MOBILE_SHELL_SCRIPT}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          onShouldStartLoadWithRequest={(request) => {
            const rewritten = rewriteDevCallback(request.url, publicOrigin);
            if (rewritten !== request.url) {
              setTimeout(() => openUrl(rewritten), 0);
              return false;
            }
            return true;
          }}
          onError={(event) => {
            const failed = event.nativeEvent?.url;
            const rewritten = rewriteDevCallback(failed, publicOrigin);
            if (rewritten && rewritten !== failed) openUrl(rewritten);
          }}
          onLoadEnd={() => setLoading(false)}
          onContentProcessDidTerminate={() => webRef.current?.reload()}
        />
        {loading ? (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator size="large" color="#7a5c42" />
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAPER,
  },
  webview: {
    flex: 1,
    backgroundColor: PAPER,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PAPER,
  },
});
