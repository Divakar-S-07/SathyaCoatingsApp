import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "./global.css";
import { PaperProvider } from "react-native-paper";
import { useState } from "react";

import Work from "./components/WorkModules/Work";
import Material from "./components/MaterialModules/MaterialDispatch";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SiteLocationDrawer from "./components/MaterialModules/SiteLocationDrawer";


export default function App() {
  const [activeTab, setActiveTab] = useState("Work");
  const [drawerVisible, setDrawerVisible] = useState(false);
  

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <Header
            headerName={activeTab === "Work" ? "Work Completion" : "Material Acknowledgement"}
            activeTab={activeTab}
            onMenuPress={() => setDrawerVisible(true)} // 👈 opens drawer
          />

          {/* Tab switching */}
          {activeTab === "Work" && (
            <Work activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {activeTab === "Material" && (
            <Material activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* Footer */}
          <Footer activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Drawer */}
          <SiteLocationDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            // locations={locations}
            // onSelectLocation={(loc) => {
            //   setSelectedLocation(loc);
            //   setDrawerVisible(false);
            // }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
