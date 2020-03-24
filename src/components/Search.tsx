import * as React from "react";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Autocomplete, { AutocompleteChangeReason } from '@material-ui/lab/Autocomplete';
import { useContext } from "../Store";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import DeleteIcon from "@material-ui/icons/Delete";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DirectionsCarIcon from '@material-ui/icons/DirectionsCar';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import { Container, Draggable } from "react-smooth-dnd";

import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { zip } from "../Utils";
const { useState } = React;

interface State {
  searchText: string;
}

export const Search: React.FC = () => {
  return (
    <>
    <SelectedLocationList />
    <AutoCompleteLocationSearch />
    <DirectionInformation />
    </>
  );
}

const SelectedLocationList: React.FC = () => {
  const { map } = useContext();
  return (
    <List>
      <Container
        onDrop={({ removedIndex, addedIndex }) => (
          removedIndex != null && addedIndex != null
          && map.switch(removedIndex, addedIndex))
      }>
        {zip(map.selectedLocations, map.limitedRoutes).map(([it, limitedRoute], i) =>
          <Draggable key={i}>
            <ListItem style={{ cursor: "pointer" }}>
              <ListItemIcon onClick={() => map.limitedRoute(it.place_id!)}>
                <IconButton edge="end" aria-label="delete">
                  {limitedRoute === "waypoint"
                    ? <MoreVertIcon />
                    : limitedRoute === "unknown"
                      ? <RadioButtonUncheckedIcon />
                      : <RadioButtonCheckedIcon />}
                </IconButton>
              </ListItemIcon>
              <ListItemText>{it.name}</ListItemText>
              <ListItemSecondaryAction onClick={() => map.remove(it)}>
                <IconButton edge="end" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </Draggable>
        )}
      </Container>
    </List>
  );
}

const DirectionInformation: React.FC = () => {
  const { map } = useContext();
  return (map.directions && map.directions?.routes[0] &&
    <List component="div">
      <ListItem>
        <ListItemIcon>
          <DirectionsCarIcon />
        </ListItemIcon>
        <ListItemText
          primary={map.directions?.routes[0].legs[0].distance.text}
          secondary={map.directions?.routes[0].legs[0].duration.text}
        />
      </ListItem>
    </List>
  ) || null;
}

const AutoCompleteLocationSearch: React.FC = () => {
  const [state, setState] = useState<State>({ searchText: "" });
  const { map } = useContext();
  return (
    <Autocomplete<google.maps.places.AutocompletePrediction>
      options={map.autocompleteResults}
      getOptionLabel={option => option.structured_formatting.main_text}
      style={{ width: 300, margin: "0 15px 0 15px" }}
      autoComplete
      includeInputInList
      inputValue={state.searchText}
      onChange={(
        _: any,
        option: google.maps.places.AutocompletePrediction | null,
        reason: AutocompleteChangeReason) =>
          ((reason === "select-option" && option)
            && (setState({ ...state, searchText: "" }), map.select(option.place_id)))}
      renderOption={option => (
        <LocationOption
          main={option.structured_formatting.main_text}
          secondery={option.structured_formatting.secondary_text}
        />
      )}
      renderInput={params =>
        <TextField {...params}
          label="経由地を追加する"
          value={state.searchText}
          onChange={e => (
            setState({ searchText: e.target.value }),
            map.autocomplete(e.target.value)
          )}
        />}
    />
  );
}

const LocationOption: React.FC<{ main: string; secondery: string }> = ({ main, secondery }) => {
  return (
    <Grid container alignItems="center">
      <Grid item>
        <LocationOnIcon />
      </Grid>
      <Grid item xs>
        <Typography variant="body1">
          {main}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {secondery}
        </Typography>
      </Grid>
    </Grid>
  );
}
