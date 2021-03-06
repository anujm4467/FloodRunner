import React from "react";
import "./App.css";
import { Switch, Route } from "react-router-dom";
import NavBar from "./Components/Shared/NavBar/NavBar";
import { Container } from "semantic-ui-react";
import Home from "./Components/Home/Home";
import FloodOverview from "./Components/FloodOverview/FloodOverview";
import ProtectedRoute from "./Routes/ProtectedRoute";
import FloodTestDetail from "./Components/FloodTestDetails/FloodTestDetail";
import TermsOfService from "./Components/Legal/TermsOfService";
import PrivacyPolicy from "./Components/Legal/PrivacyPolicy";
import Welcome from "./Components/Welcome/Welcome";
import Footer from "./Components/Shared/Footer/Footer";

function App(): JSX.Element {
  return (
    <div
      style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}
    >
      <NavBar />
      <div style={{ flex: 1 }}>
        <Container>
          <Switch>
            <Route
              path={"/legal/termsofservice"}
              exact={true}
              component={TermsOfService}
            />
            <Route
              path={"/legal/privacypolicy"}
              exact={true}
              component={PrivacyPolicy}
            />
            <Route path={"/welcome"} exact={true} component={Welcome} />
            <ProtectedRoute path="/tests/:testId" component={FloodTestDetail} />
            <ProtectedRoute path={"/"} component={FloodOverview} />
          </Switch>
        </Container>
      </div>
      <Footer />
    </div>
  );
}

export default App;
