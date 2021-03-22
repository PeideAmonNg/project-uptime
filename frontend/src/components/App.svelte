<script>
  import { Router, Link, Route } from "svelte-routing";
  import User from './User.svelte';
  import Users from './Users.svelte';
  import LastOnline from './LastOnline.svelte';
  import Auth from '../Auth';
  Auth.getApiKey();
</script>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1"> 
</head>
<main>
  <Router url="">
    <nav>
      <Link to="/">Last online</Link>
      <Link to="/users">Users</Link>
    </nav>
    <div>
      <Route path="/" component="{LastOnline}"></Route>
      <Route path="/users/:id" component="{User}"></Route>
      <Route path="/users" component="{Users}"></Route>
    </div>
  </Router>
</main>