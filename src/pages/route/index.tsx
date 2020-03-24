import { NextPage } from "next";
import Button from "@material-ui/core/Button";
import Drawer from "@material-ui/core/Drawer";
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import { Search } from "../../components/Search";
import { StoreProvider } from "../../Store";
import { useState, useEffect } from "react";
import { initServices } from "../../Map";

interface State {
  isDrawerOpen: boolean;
}

export const Route: NextPage = () => {
  useEffect(() => { initServices() },[])
  const [state, setState] = useState<State>({ isDrawerOpen: false });
  return (
    <>
    <style jsx>{`
    #map {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
    #app {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
    `}</style>

    <StoreProvider>
    <Button
      variant="contained"
      color="default"
      style={{
        position: "relative",
        zIndex: 1,
        left: -36,
        top: 120,
        height: 60
      }}
      onClick={() => setState({ isDrawerOpen: !state.isDrawerOpen })}
    >
      {state.isDrawerOpen
        ? <ChevronLeftIcon style={{ position: "relative", left: 18 }} />
        : <ChevronRightIcon style={{ position: "relative", left: 18 }} />}
    </Button>
    <Drawer
      anchor="left"
      open={state.isDrawerOpen}
      variant="persistent"
    >
      <Button
        variant="contained"
        color="default"
        onClick={() => setState({ isDrawerOpen: !state.isDrawerOpen })}
        style={{ margin: "8px 15px 8px 15px" }}
      ><ChevronLeftIcon/></Button>
      <Search />
    </Drawer>
    </StoreProvider>
    <div id="map" />
    </>
  );
}

export default Route;
