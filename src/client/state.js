import {atom} from "recoil";

export const votesState = atom({
    key: 'votesState',
    default: []
});

export const configState = atom({
    key: 'config',
    default: {}
});

export const userState = atom({
    key: 'user',
    default: '',
});

export const userSubmittedState = atom({
    key: 'user-submitted',
    default: false,
});

export const selectedPointsState = atom({
    key: 'selectedPoints'
});