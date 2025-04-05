import React, { useState, useEffect } from "react";

const SpotifyPlayer = () => {
  // Authentication states
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Player states
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [deviceId, setDeviceId] = useState("");
  const [player, setPlayer] = useState(null);

  // UI states
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [queue, setQueue] = useState([]);
  const [activeView, setActiveView] = useState("playlists"); // 'playlists', 'search', or 'queue'

  // Spotify API credentials
  const CLIENT_ID = "514c87151e614bc19d4f7c4239098b98";
  const REDIRECT_URI = window.location.origin;

  // Initialize Spotify authentication
  useEffect(() => {
    // Check if returning from Spotify auth
    const hash = window.location.hash
      .substring(1)
      .split("&")
      .reduce((initial, item) => {
        if (item) {
          const parts = item.split("=");
          initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
      }, {});

    window.location.hash = "";
    const _token = hash.access_token;

    if (_token) {
      // Store token with Bearer prefix
      const authToken = `Bearer ${_token}`;
      setToken(authToken);
      setAuthenticated(true);
      localStorage.setItem("spotify_token", authToken);
      initializePlayer(_token); // Note: SDK uses raw token
      
    } else {
      const storedToken = localStorage.getItem("spotify_token");
      if (storedToken) {
        setToken(storedToken);
        setAuthenticated(true);
        // Remove Bearer prefix for SDK
        initializePlayer(storedToken.replace("Bearer ", ""));
      }
    }
  }, []);


  const initializePlayer = (token) => {
    // Check if script is already loaded
    if (window.Spotify) {
      initializeSpotifyPlayer(token);
      return;
    }
  
    // Load Spotify Player script
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    
    script.onload = () => {
      console.log("Spotify SDK script loaded successfully");
    };
    
    script.onerror = (error) => {
      console.error("Failed to load Spotify SDK script:", error);
      alert("Failed to load Spotify player. Please check your internet connection and try again.");
    };
    
    document.body.appendChild(script);
  
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify Web Playback SDK is ready");
      initializeSpotifyPlayer(token);
    };
  };


  // Fetch user playlists
  const fetchPlaylists = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/playlists?limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        // Token expired
        setAuthenticated(false);
        localStorage.removeItem("spotify_token");
        alert("Your session has expired. Please log in again.");
        return;
      }

      const data = await response.json();
      console.log("Playlists fetched:", data);

      if (data.items && data.items.length > 0) {
        setPlaylists(
          data.items.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.images[0]?.url || "/api/placeholder/64/64",
            tracks: item.tracks?.total || 0,
            owner: item.owner.display_name,
          }))
        );

        // Load first playlist by default
        loadPlaylist(data.items[0].id);
      } else {
        console.log("No playlists found");
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      alert("Error loading playlists: " + error.message);
    }
  };

  // Fetch featured playlists when user has no playlists
  const fetchFeaturedPlaylists = async (token) => {
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/browse/featured-playlists?limit=10",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Featured playlists fetched:", data);

      if (
        data.playlists &&
        data.playlists.items.length > 0 &&
        playlists.length === 0
      ) {
        setPlaylists(
          data.playlists.items.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.images[0]?.url || "/api/placeholder/64/64",
            tracks: item.tracks?.total || 0,
            owner: "Spotify",
          }))
        );

        // Load first featured playlist
        loadPlaylist(data.playlists.items[0].id);
      }
    } catch (error) {
      console.error("Error fetching featured playlists:", error);
    }
  };
  useEffect(() => {
    // Check for token existence and validity before initializing the player
    const checkToken = () => {
      // Check if returning from Spotify auth
      const hash = window.location.hash
        .substring(1)
        .split("&")
        .reduce((initial, item) => {
          if (item) {
            const parts = item.split("=");
            initial[parts[0]] = decodeURIComponent(parts[1]);
          }
          return initial;
        }, {});
  
      console.log("URL hash:", hash); // Debug log
      window.location.hash = "";
      const _token = hash.access_token;
  
      if (_token) {
        console.log("Token found in URL:", _token.substring(0, 5) + "..."); // Show first 5 chars only for security
        setToken(_token);
        setAuthenticated(true);
        localStorage.setItem("spotify_token", _token);
        return _token;
      } else {
        const storedToken = localStorage.getItem("spotify_token");
        console.log("Checking localStorage for token:", storedToken ? "Found" : "Not found");
        if (storedToken) {
          setToken(storedToken);
          setAuthenticated(true);
          return storedToken;
        }
      }
      return null;
    };
  
    const validToken = checkToken();
    if (validToken) {
      initializePlayer(validToken);
    } else {
      console.log("No valid token found, showing login screen");
      setAuthenticated(false);
    }
  }, []);
  
  // Update your loadPlaylist function to check for token before making the request
  const loadPlaylist = async (playlistId) => {
    try {
      setActiveView("playlists");
      
      // Check if token exists
      if (!token) {
        console.error("No authentication token available");
        setAuthenticated(false);
        alert("No authentication token available. Please log in again.");
        return;
      }
      
      console.log("Loading playlist with token:", token.substring(0, 5) + "...");
  
      // Ensure token has Bearer prefix
      const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );
  
      // Handle response
      if (response.status === 401) {
        // Token expired, clear and request new login
        localStorage.removeItem("spotify_token");
        setAuthenticated(false);
        throw new Error("Authentication token expired. Please login again.");
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Playlist error response:", errorText);
        throw new Error(`Failed to load playlist: ${response.status} - ${errorText}`);
      }
  
      // Process successful response
      const data = await response.json();
      // The rest of your function...
    } catch (error) {
      console.error("Error loading playlist:", error);
      alert("Error loading playlist: " + error.message);
    }
  };

  // Search Spotify for tracks
  const searchSpotify = async (query) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setActiveView("search");

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search results:", data);

      if (data.tracks && data.tracks.items) {
        const results = data.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((artist) => artist.name).join(", "),
          album: track.album.name,
          duration: formatTime(track.duration_ms / 1000),
          coverUrl: track.album.images[0]?.url || "/api/placeholder/64/64",
          uri: track.uri,
        }));

        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching tracks:", error);
      alert("Error searching: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Add track to queue
  const addToQueue = async (trackUri) => {
    try {
      // Add to Spotify queue
      await fetch(
        `https://api.spotify.com/v1/me/player/queue?uri=${trackUri}&device_id=${deviceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Find track details to add to our queue UI
      let trackToAdd;
      if (activeView === "search") {
        trackToAdd = searchResults.find((track) => track.uri === trackUri);
      } else {
        trackToAdd = tracks.find((track) => track.uri === trackUri);
      }

      if (trackToAdd) {
        setQueue((prevQueue) => [...prevQueue, trackToAdd]);
        alert(`Added "${trackToAdd.name}" to queue`);
      }
    } catch (error) {
      console.error("Error adding to queue:", error);
      alert("Error adding to queue: " + error.message);
    }
  };

  // View queue
  const viewQueue = () => {
    setActiveView("queue");
  };

  // Transfer playback to current device
  const transferPlayback = async (token, deviceId) => {
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
      console.log("Playback transferred to device:", deviceId);
    } catch (error) {
      console.error("Error transferring playback:", error);
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (player) {
      player
        .togglePlay()
        .then(() => {
          setIsPlaying(!isPlaying);
        })
        .catch((err) => {
          console.error("Toggle play error:", err);
          alert("Error toggling playback. Please try again.");
        });
    }
  };

  // Play a specific track
  const playTrack = (trackUri) => {
    if (player && deviceId) {
      console.log("Playing track:", trackUri);
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((error) => {
              throw new Error(
                `Failed to play track: ${
                  error.error?.message || response.status
                }`
              );
            });
          }
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Error playing track:", err);
          alert("Error playing track: " + err.message);
        });
    } else {
      alert("Player not ready yet. Please wait a moment and try again.");
    }
  };

  // Skip to previous track
  const previousTrack = () => {
    if (player) {
      player
        .previousTrack()
        .then(() => {
          console.log("Skipped to previous track");
        })
        .catch((err) => {
          console.error("Previous track error:", err);
          alert("Error skipping to previous track: " + err.message);
        });
    }
  };

  // Skip to next track
  const nextTrack = () => {
    if (player) {
      player
        .nextTrack()
        .then(() => {
          console.log("Skipped to next track");
        })
        .catch((err) => {
          console.error("Next track error:", err);
          alert("Error skipping to next track: " + err.message);
        });
    }
  };

  // Change volume
  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume / 100).then(() => {
        console.log("Volume changed to", newVolume);
      });
    }
  };

  // Seek to position
  const seekToPosition = (position) => {
    if (player) {
      player.seek(position * 1000).then(() => {
        console.log("Seeking to position", position);
      });
    }
    setCurrentTime(position);
  };

  // Convert seconds to MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // Update current time every second while playing
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= duration) {
            clearInterval(interval);
            return 0;
          }
          return prevTime + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Login with Spotify
  const login = () => {
    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-library-read",
      "user-library-modify",
      "user-read-playback-state",
      "user-modify-playback-state",
      "playlist-read-private",  // Add this scope
      "playlist-read-collaborative"  // Add this if you need collaborative playlists
    ];

    window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(
      scopes.join(" ")
    )}&response_type=token&show_dialog=true`;
  };

  // Log errors to console
  useEffect(() => {
    if (!authenticated && !localStorage.getItem("spotify_token")) {
      console.log("Not authenticated, showing login screen");
    }

    // Handle window click for SDK errors
    const handleWindowClick = () => {
      if (player && !deviceId) {
        player.connect();
      }
    };

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [authenticated, player, deviceId]);

  // If not authenticated, show login screen
  if (!authenticated) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-4xl font-bold mb-8">MusicStream</div>
        <p className="mb-8">
          Connect with your Spotify account to start listening
        </p>
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full"
          onClick={login}
        >
          Connect to Spotify
        </button>
        <p className="mt-4 text-gray-400 text-sm">
          Note: You need a Spotify Premium account to use this player
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Main container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4">
          <div className="mb-8">
            <div className="text-xl font-bold mb-6 text-green-500">
              MusicStream
            </div>
            <div
              className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer transition-all mb-2"
              onClick={() => setActiveView("playlists")}
            >
              <div className="mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div>Home</div>
            </div>
            <div className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer transition-all mb-2">
              <div className="mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>Search</div>
            </div>
            <div
              className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer transition-all mb-2"
              onClick={viewQueue}
            >
              <div className="mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <div>Queue ({queue.length})</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold">YOUR LIBRARY</div>
              <div className="cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="p-2 hover:bg-gray-700 rounded cursor-pointer transition-all"
                  onClick={() => loadPlaylist(playlist.id)}
                >
                  {playlist.name}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No playlists found</div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search bar */}
          <div className="p-4 bg-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for songs, artists, or albums"
                className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && searchSpotify(searchTerm)
                }
              />
              <div
                className="absolute left-3 top-2.5 cursor-pointer"
                onClick={() => searchSpotify(searchTerm)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {searchTerm && (
                <div
                  className="absolute right-3 top-2.5 cursor-pointer"
                  onClick={() => setSearchTerm("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {activeView === "search" ? (
            // Search results view
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Search Results for "{searchTerm}"
              </h2>
              {isSearching ? (
                <div className="text-center py-8">
                  <p>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm">
                      <th className="pb-2 text-left w-12">#</th>
                      <th className="pb-2 text-left">TITLE</th>
                      <th className="pb-2 text-left">ALBUM</th>
                      <th className="pb-2 text-right">ACTIONS</th>
                      <th className="pb-2 text-right">DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((track, index) => (
                      <tr
                        key={track.id}
                        className={`hover:bg-gray-800 cursor-pointer ${
                          currentTrack?.name === track.name
                            ? "text-green-500"
                            : ""
                        }`}
                      >
                        <td className="py-3">{index + 1}</td>
                        <td onClick={() => playTrack(track.uri)}>
                          <div className="flex items-center">
                            <div className="mr-3">
                              <img
                                src={track.coverUrl}
                                alt={track.album}
                                className="w-10 h-10"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{track.name}</div>
                              <div className="text-sm text-gray-400">
                                {track.artist}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-400">{track.album}</td>
                        <td className="text-right">
                          <button
                            className="text-gray-400 hover:text-green-500 mr-2"
                            onClick={() => addToQueue(track.uri)}
                            title="Add to queue"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                            </svg>
                          </button>
                          <button
                            className="text-gray-400 hover:text-green-500"
                            onClick={() => playTrack(track.uri)}
                            title="Play now"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="text-right text-gray-400">
                          {track.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No results found</p>
                </div>
              )}
            </div>
          ) : activeView === "queue" ? (
            // Queue view
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Your Queue</h2>
              {queue.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm">
                      <th className="pb-2 text-left w-12">#</th>
                      <th className="pb-2 text-left">TITLE</th>
                      <th className="pb-2 text-left">ALBUM</th>
                      <th className="pb-2 text-right">ACTIONS</th>
                      <th className="pb-2 text-right">DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((track, index) => (
                      <tr
                        key={track.id}
                        className={`hover:bg-gray-800 cursor-pointer ${
                          currentTrack?.name === track.name
                            ? "text-green-500"
                            : ""
                        }`}
                      >
                        <td className="py-3">{index + 1}</td>
                        <td onClick={() => playTrack(track.uri)}>
                          <div className="flex items-center">
                            <div className="mr-3">
                              <img
                                src={track.coverUrl}
                                alt={track.album}
                                className="w-10 h-10"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{track.name}</div>
                              <div className="text-sm text-gray-400">
                                {track.artist}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-400">{track.album}</td>
                        <td className="text-right">
                          <button
                            className="text-gray-400 hover:text-green-500"
                            onClick={() => playTrack(track.uri)}
                            title="Play now"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="text-right text-gray-400">
                          {track.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Your queue is empty</p>
                </div>
              )}
            </div>
          ) : (
            // Playlist view
            <div className="p-6">
              {currentPlaylist ? (
                <>
                  <div className="flex items-start mb-6">
                    <div className="mr-6">
                      <img
                        src={currentPlaylist.image}
                        alt={currentPlaylist.name}
                        className="w-48 h-48 shadow-lg"
                      />
                    </div>
                    <div>
                      <div className="text-sm uppercase text-gray-400 mb-1">
                        PLAYLIST
                      </div>
                      <h1 className="text-4xl font-bold mb-4">
                        {currentPlaylist.name}
                      </h1>
                      <div className="text-gray-400 mb-4">
                        {currentPlaylist.description}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">
                          {currentPlaylist.owner} • {currentPlaylist.tracks}{" "}
                          songs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <button className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-full mr-4">
                      Play
                    </button>
                  </div>

                  {tracks.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-sm">
                          <th className="pb-2 text-left w-12">#</th>
                          <th className="pb-2 text-left">TITLE</th>
                          <th className="pb-2 text-left">ALBUM</th>
                          <th className="pb-2 text-right">ACTIONS</th>
                          <th className="pb-2 text-right">DURATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tracks.map((track, index) => (
                          <tr
                            key={track.id}
                            className={`hover:bg-gray-800 cursor-pointer ${
                              currentTrack?.name === track.name
                                ? "text-green-500"
                                : ""
                            }`}
                          >
                            <td className="py-3">{index + 1}</td>
                            <td onClick={() => playTrack(track.uri)}>
                              <div className="flex items-center">
                                <div className="mr-3">
                                  <img
                                    src={track.coverUrl}
                                    alt={track.album}
                                    className="w-10 h-10"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {track.name}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {track.artist}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-gray-400">{track.album}</td>
                            <td className="text-right">
                              <button
                                className="text-gray-400 hover:text-green-500 mr-2"
                                onClick={() => addToQueue(track.uri)}
                                title="Add to queue"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                                </svg>
                              </button>
                              <button
                                className="text-gray-400 hover:text-green-500"
                                onClick={() => playTrack(track.uri)}
                                title="Play now"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </td>
                            <td className="text-right text-gray-400">
                              {track.duration}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">
                        No tracks found in this playlist
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    Select a playlist to view tracks
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player footer */}
      <div className="bg-gray-800 border-t border-gray-700 py-3 px-4">
        <div className="flex items-center justify-between">
          {/* Track info */}
          <div className="flex items-center w-1/3">
            {currentTrack ? (
              <>
                <div className="mr-3">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.album}
                    className="w-14 h-14"
                  />
                </div>
                <div>
                  <div className="font-medium">{currentTrack.name}</div>
                  <div className="text-sm text-gray-400">
                    {currentTrack.artist}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No track playing</div>
            )}
          </div>

          {/* Player controls */}
          <div className="flex flex-col items-center w-1/3">
            <div className="flex items-center mb-2">
              <button
                className="text-gray-400 hover:text-white mx-2"
                onClick={previousTrack}
                disabled={!currentTrack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>
              <button
                className="bg-white hover:bg-gray-200 text-black rounded-full p-2 mx-4"
                onClick={togglePlay}
                disabled={!currentTrack}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                className="text-gray-400 hover:text-white mx-2"
                onClick={nextTrack}
                disabled={!currentTrack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
                </svg>
              </button>
            </div>
            <div className="w-full flex items-center">
              <div className="text-xs text-gray-400 mr-2">
                {formatTime(currentTime)}
              </div>
              <div className="flex-1 mx-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  value={currentTime}
                  className="w-full"
                  onChange={(e) => seekToPosition(Number(e.target.value))}
                  disabled={!currentTrack}
                />
              </div>
              <div className="text-xs text-gray-400 ml-2">
                {currentTrack ? currentTrack.duration : "0:00"}
              </div>
            </div>
          </div>

          {/* Volume control */}
          <div className="flex items-center justify-end w-1/3">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                className="w-24"
                onChange={(e) => changeVolume(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
