exports.fillTikTokChart = async () => {
  const response = await fetch('/api/socialBlade/tiktok');
  const youtubeResponse = await fetch('/api/socialBlade/youtube');
  const youtubeData = await youtubeResponse.json();
  const tiktokData = await response.json();
  const tiktokFollower = tiktokData.map((e) => Number(e.followers)).slice(0, 24).reverse();

  const youtubeSubs = youtubeData.map((e) => Number(e.subs)).slice(0, 24).reverse();

  const ctx = document.getElementById('TikTokFollowerRene').getContext('2d'); // noinspection JSUnusedGlobalSymbols

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['-24', '-23', '-22', '-21', '-20', '-19', '-18', '-17', '-16', '-15', '-14', '-13', '-12', '-11', '-10', '-9', '-8', '-7', '-6', '-5', '-4', '-3', '-2', '-1', 'today'],
      datasets: [
        {
          label: 'TikTok Follower', borderColor: 'rgb(0,0,0)', backgroundColor: 'transparent', data: tiktokFollower, yAxisID: 'A',
        },
        {
          label: 'Youtube Subs', borderColor: 'rgb(255,0,0)', backgroundColor: 'rgb(255,255,255)', data: youtubeSubs, yAxisID: 'B',
        },
      ],
    },
    options: {
      scales: {
        xAxes: [
          {
            gridLines: {
              display: 0,
            },
          },
        ],
        yAxes: [
          {
            id: 'A',
            gridLines: {
              display: 0,
            },
            position: 'left',
            ticks: {
              callback: (value) => `${(
                value / 1000).toString()}k`,
            },
          },
          {
            id: 'B',
            gridLines: {
              display: 0,
            },
            position: 'right',

            ticks: {
              callback: (value) => `${(
                value / 1).toString()}`,
            },
          },
        ],
      },
      legend: {
        display: true,
      },
    },
  });
};
