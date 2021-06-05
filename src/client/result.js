import {useRecoilState, useRecoilValue} from "recoil";
import React from "react";
import {everyoneHasVoted} from "./common";
import {configState, votesState} from "./state";

export const Result = () => {
    const [votes] = useRecoilState(votesState);
    const config = useRecoilValue(configState);
    const options = config.template && config.template.options || [];

    if (everyoneHasVoted(votes)) {
        const participantVotes = votes.filter(v => !v.observer);

        if (participantVotes.length === 0) {
            return <h1>?</h1>;
        }

        const conflictingVotes = participantVotes.filter(v => {
            const option = options.find(o => o.text === v.vote);
            if (option) {
                const conflicting = option.conflicting;
                return conflicting.find(c => {
                    return participantVotes.map(pv => pv.vote).find(pv => pv === c);
                });
            } else {
                return false;
            }
        });

        const votesWithIndexes = votes.map(v => {
            const option = options.find(o => o.text === v.vote);
            return {
                ...v,
                index: options.lastIndexOf(option)
            };
        });
        votesWithIndexes.sort((a,b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0));

        const largestVote = votesWithIndexes.pop();

        if (conflictingVotes.length > 0) {
            return <h2>Conflicting votes!</h2>;
        } else {
            return <h2>{largestVote.vote}</h2>;
        }
    } else {
        return <h2>Waiting for votes...</h2>;
    }
};