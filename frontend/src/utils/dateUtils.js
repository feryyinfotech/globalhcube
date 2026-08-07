import moment from 'moment';

export const toLocalMoment = (dateStr) => moment.utc(dateStr).local(true);
