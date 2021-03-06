// @flow

import { setLastN } from '../base/conference';
import { SET_CALLEE_INFO_VISIBLE } from '../base/jwt';
import { pinParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';

import { SET_FILMSTRIP_ENABLED } from './actionTypes';

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CALLEE_INFO_VISIBLE:
        return _setCalleeInfoVisible(store, next, action);

    case SET_FILMSTRIP_ENABLED:
        return _setFilmstripEnabled(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature filmstrip that the action
 * {@link SET_CALLEE_INFO_VISIBLE} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code SET_CALLEE_INFO_VISIBLE}
 * which is being dispatched in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setCalleeInfoVisible({ getState }, next, action) {
    if (typeof APP !== 'undefined') {
        const oldValue
            = Boolean(getState()['features/base/jwt'].calleeInfoVisible);
        const result = next(action);
        const newValue
            = Boolean(getState()['features/base/jwt'].calleeInfoVisible);

        oldValue === newValue

            // FIXME The following accesses the private state filmstrip of
            // Filmstrip. It is written with the understanding that Filmstrip
            // will be rewritten in React and, consequently, will not need the
            // middleware implemented here, Filmstrip.init, and UI.start.
            || (Filmstrip.filmstrip && Filmstrip.toggleFilmstrip(!newValue));

        return result;
    }

    return next(action);
}

/**
 * Notifies the feature filmstrip that the action {@link SET_FILMSTRIP_ENABLED}
 * is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code SET_FILMSTRIP_ENABLED} which
 * is being dispatched in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setFilmstripEnabled({ dispatch, getState }, next, action) {
    const result = next(action);

    // FIXME The logic for participant pinning / unpinning is not on React yet
    // so dispatching the action is not enough. Hence, perform the following
    // only where it will be sufficient i.e. mobile.
    if (typeof APP === 'undefined') {
        const state = getState();
        const { enabled } = state['features/filmstrip'];
        const { audioOnly } = state['features/base/conference'];

        enabled || dispatch(pinParticipant(null));

        // FIXME Audio-only mode fiddles with lastN as well. That's why we don't
        // touch lastN in audio-only mode. But it's not clear what the value of
        // lastN should be upon exit from audio-only mode if the filmstrip is
        // disabled already. Currently, audio-only mode will set undefined
        // regardless of whether the filmstrip is disabled. But we don't have a
        // practical use case in which audio-only mode is exited while the
        // filmstrip is disabled.
        audioOnly || dispatch(setLastN(enabled ? undefined : 1));
    }

    return result;
}
