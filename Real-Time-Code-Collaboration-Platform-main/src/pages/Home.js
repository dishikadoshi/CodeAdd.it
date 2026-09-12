import React, {useState} from 'react';
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import {Link, useNavigate} from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="homeGrid">
                <div className="heroPanel">
                    <div className="brandRow">
                        <img
                            className="heroLogo"
                            src="/logo.svg"
                            alt="codeadd-it-logo"
                        />
                    </div>
                    <h1 className="heroHeadline">Code together, in the same line, at the same time.</h1>
                    <p className="heroSub">
                        Spin up a room, share the ID, and watch every keystroke, cursor,
                        and file update sync live — no setup, no installs.
                    </p>

                    <div className="mockEditor" aria-hidden="true">
                        <div className="mockEditorHeader">
                            <span className="mockDot mockDotRed"></span>
                            <span className="mockDot mockDotYellow"></span>
                            <span className="mockDot mockDotGreen"></span>
                            <span className="mockFileName">app.js</span>
                        </div>
                        <pre className="mockCode">
<span className="mockToken-kw">function</span> <span className="mockToken-fn">sum</span>(a, b) {'{'}
  <span className="mockToken-kw">return</span> a + b;
{'}'}

sum(<span className="mockToken-mut">4</span>, <span className="mockToken-mut">7</span>);
                        </pre>
                        <div className="liveCursor cursorMaya">
                            <span className="caret"></span>
                            <span className="tag">Maya</span>
                        </div>
                        <div className="liveCursor cursorTheo">
                            <span className="caret"></span>
                            <span className="tag">Theo</span>
                        </div>
                    </div>
                </div>

                <div className="formPanel">
                    <div className="formWrapper">
                        <h4 className="mainLabel">Generate a new room or paste an invitation ROOM ID</h4>
                        <div className="inputGroup">
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="ROOM ID"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                            <input
                                type="text"
                                className="inputBox"
                                placeholder="USERNAME"
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                onKeyUp={handleInputEnter}
                            />
                            <button className="btn joinBtn" onClick={joinRoom}>
                                Join
                            </button>
                            <span className="createInfo">
                                If you don't have an invite then create &nbsp;
                                <Link
                                    onClick={createNewRoom}
                                    href=""
                                    className="createNewBtn"
                                >
                                    new room
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <footer>
                <h4>
                    Built by &nbsp;
                    <a href="https://github.com/dishikadoshi" target="_blank" rel="noopener noreferrer">Dishika Doshi</a>
                </h4>
            </footer>
        </div>
    );
};

export default Home;