import { Client, query } from 'faunadb'
import { useEffect, useState } from 'react'
import './App.css'
import logo from './logo.svg'
// import Get from 'faunadb/query/Get';
// import Index from 'faunadb/query/Index';
// import Let from 'faunadb/query/Let';
// import Map from 'faunadb/query/Map';
// import Match from 'faunadb/query/Match';
// import Merge from 'faunadb/query/Merge';
// import Paginate from 'faunadb/query/Paginate';
// import Select from 'faunadb/query/Select';
// import Var from 'faunadb/query/Var';
const { Get, FaunaIndex, Let, Map, Match, Merge, Paginate, Select, Var } = query

const client = new Client({
  secret: process.env.REACT_APP_FAUNADB_SECRET,
})
function App() {
  const data = useData()

  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        {JSON.stringify(data)}
        <a
          className='App-link'
          href='https://reactjs.org'
          target='_blank'
          rel='noopener noreferrer'
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

function useData() {
  const [state, setstate] = useState()

  useEffect(() => {
    client
      .query(
        Map(
          Paginate(Match(FaunaIndex('all_Spaceships_by_pendingFuelTons'))),
          (pendingFuelTons, ref) =>
            Let(
              {
                ship: Get(ref),
                pilot: Get(Select(['data', 'pilot'], Var('ship'))),
              },
              Merge(Select(['data'], Var('ship')), {
                pendingFuelTons,
                ref,
                pilot: Select(['data', 'name'], Var('pilot')),
              })
            )
        )
      )
      .then((resp) => setstate(resp.data))
  }, [])

  return state
}

export default App
