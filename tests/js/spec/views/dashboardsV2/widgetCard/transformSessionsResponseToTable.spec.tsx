import {transformSessionsResponseToTable} from 'sentry/views/dashboardsV2/widgetCard/transformSessionsResponseToTable';

describe('transformSessionsResponseToTable', function () {
  it('transforms sessions into table', () => {
    expect(
      transformSessionsResponseToTable(TestStubs.SessionUserCountByStatusByRelease())
    ).toEqual({
      data: [
        {
          'count_unique(user)': 1,
          id: '0',
          release: '1',
          'session.status': 'crashed',
          'sum(session)': 34,
        },
        {
          'count_unique(user)': 1,
          id: '1',
          release: '1',
          'session.status': 'abnormal',
          'sum(session)': 1,
        },
        {
          'count_unique(user)': 2,
          id: '2',
          release: '1',
          'session.status': 'errored',
          'sum(session)': 451,
        },
        {
          'count_unique(user)': 3,
          id: '3',
          release: '1',
          'session.status': 'healthy',
          'sum(session)': 5058,
        },
        {
          'count_unique(user)': 2,
          id: '4',
          release: '2',
          'session.status': 'crashed',
          'sum(session)': 35,
        },
        {
          'count_unique(user)': 1,
          id: '5',
          release: '2',
          'session.status': 'abnormal',
          'sum(session)': 1,
        },
        {
          'count_unique(user)': 1,
          id: '6',
          release: '2',
          'session.status': 'errored',
          'sum(session)': 452,
        },
        {
          'count_unique(user)': 10,
          id: '7',
          release: '2',
          'session.status': 'healthy',
          'sum(session)': 5059,
        },
      ],
      meta: {
        'count_unique(user)': 'integer',
        release: 'string',
        'session.status': 'string',
        'sum(session)': 'integer',
      },
    });
  });
});
