import { toast } from 'material-react-toastify';

export const showError = (msg) => toast.error(msg);
export const showMessage = (msg, dark) => {
    if (dark) {
        toast.dark(msg);
    } else {
        toast.info(msg);
    }
}

export const sendMessage = (client, type, message) => {
    if (client) {
        client.emit(type, JSON.stringify(message));
    }
};

export const everyoneHasVoted = (votes) => {
    return votes
        .filter(v => !v.observer)
        .filter(v => !v.hasOwnProperty('vote'))
        .length === 0;
};
