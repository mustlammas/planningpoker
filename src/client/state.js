import {atom} from "recoil";

export const votesState = atom({
    key: 'votesState',
    default: []
});

export const configState = atom({
    key: 'config',
    default: {}
});