<script>
  import '../app.css';
  import ogImage from '$lib/assets/og_image.jpg';
</script>

<svelte:head>
  <title>Free Plinko Game Online - Play & Win Instant Rewards</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link rel="canonical" href="https://plinko-game-online.github.io/"/>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
    rel="stylesheet"
  />
  <meta name="description" content="Experience authentic Plinko gameplay online! Drop discs through pegs for exciting rewards in this classic arcade game. No download or registration required - start playing instantly and win."/>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Free Plinko Game Online" />
  <meta property="og:url" content="https://plinko-game-online.github.io/" />
  <meta property="og:image" content={ogImage} />
  <meta name="google-site-verification" content="lTwaQTJ2H6vMNYMUd9ooaLxzvssiGoQEuoRdsOYNX8g" />
</svelte:head>

<slot />
