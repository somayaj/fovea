import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const PAPER = "#f9f6ee";

function withMobileParam(url) {
  if (!url) return url;
  return url.includes("?") ? `${url}&mobile=1` : `${url}?mobile=1`;
}

/** Dev URL for the Vite client. Simulator uses localhost; device uses LAN IP via Expo host. */
function resolveAppUrl() {
  const configured = process.env.EXPO_PUBLIC_FOVEA_URL?.trim();
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
  const appUrl = useMemo(() => resolveAppUrl(), []);
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <WebView
          ref={webRef}
          source={{ uri: appUrl }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={MOBILE_SHELL_SCRIPT}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          onLoadEnd={() => setLoading(false)}
          onContentProcessDidTerminate={() => webRef.current?.reload()}
          applicationNameForUserAgent="FoveaMobile"
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
