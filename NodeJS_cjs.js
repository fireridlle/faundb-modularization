const faunadb = require('faunadb')
const q = require('faunadb/query')

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
})

;(async function () {
  try {
    // await initData();
    const spaceShipsByPendingFuelTons = await client.query(
      q.Map(
        q.Paginate(q.Match(q.FaunaIndex('all_Spaceships_by_pendingFuelTons'))),
        (pendingFuelTons, ref) =>
          q.Let(
            {
              ship: q.Get(ref),
              pilot: q.Get(q.Select(['data', 'pilot'], q.Var('ship'))),
            },
            q.Merge(q.Select(['data'], q.Var('ship')), {
              pendingFuelTons,
              ref,
              pilot: q.Select(['data', 'name'], q.Var('pilot')),
            })
          )
      )
    )

    console.info('data')
    console.info(spaceShipsByPendingFuelTons.data)
  } catch (err) {
    console.info(err)
  }
})()

async function initData() {
  await createCollections()
  await createData()
  await createIndex()
}

function createCollections() {
  return Promise.all([
    client.query(q.CreateCollection({ name: 'Spaceships' })),
    client.query(q.CreateCollection({ name: 'Pilots' })),
  ])
}

async function createData() {
  const pilots = await client.query(
    q.Map(
      [
        { name: 'Flash Gordon' },
        { name: 'Paul J. Weitz' },
        { name: 'Robert Crippen' },
      ],
      (data) => q.Create(q.Collection('Pilots'), { data })
    )
  )

  await client.query(
    q.Map(
      [
        {
          name: 'Millennium Hawk',
          maxFuelTons: 10,
          actualFuelTons: 1,
          pilot: pilots[0].ref,
        },
        {
          name: 'SpaceX Dragon',
          maxFuelTons: 12,
          actualFuelTons: 12,
          pilot: pilots[1].ref,
        },
        {
          name: 'Skylab',
          maxFuelTons: 5,
          actualFuelTons: 4,
          pilot: pilots[2].ref,
        },
      ],
      (data) => q.Create(q.Collection('Spaceships'), { data })
    )
  )
}

async function createIndex() {
  await client.query(
    q.CreateIndex({
      name: 'all_Spaceships_by_pendingFuelTons',
      source: {
        collection: q.Collection('Spaceships'),
        fields: {
          pendingFuelTons: q.Query(
            q.Lambda(
              'shipDoc',
              q.Subtract(
                q.Select(['data', 'maxFuelTons'], q.Var('shipDoc')),
                q.Select(['data', 'actualFuelTons'], q.Var('shipDoc'))
              )
            )
          ),
        },
      },
      values: [{ binding: 'pendingFuelTons' }, { field: ['ref'] }],
    })
  )
}
