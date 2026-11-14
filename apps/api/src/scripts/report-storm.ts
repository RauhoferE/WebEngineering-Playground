const API = process.env.API_URL ?? 'http://localhost:3000';
const N = Number(process.argv[2] ?? 50);

// A fresh comment per run, so earlier runs cannot distort the count
const created = await fetch(`${API}/api/bears/u-arctos/comments`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ author: 'Report storm', text: 'please report me' }),
});
const { id } = (await created.json()) as { id: string };

const statuses = await Promise.all(
  Array.from({ length: N }, async () => {
    const res = await fetch(`${API}/api/comments/${id}/report`, {
      method: 'POST',
    });
    return res.status;
  })
);

const final = (await (await fetch(`${API}/api/comments/${id}`)).json()) as {
  reportCount: number;
  hiddenAt: string | null;
};
console.log({
  requests: N,
  answered200: statuses.filter((s) => s === 200).length,
  finalCount: final.reportCount,
  lostUpdates: N - final.reportCount,
  hidden: final.hiddenAt !== null,
});
