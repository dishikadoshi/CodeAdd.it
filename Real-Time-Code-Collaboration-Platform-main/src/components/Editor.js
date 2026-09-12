import React, { useEffect, useRef, useImperativeHandle } from "react";
import { language, cmtheme } from "../../src/atoms";
import { useRecoilValue } from "recoil";
import ACTIONS from "../actions/Actions";

// CODE MIRROR
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";

// theme (all imports remain same...)
import "codemirror/theme/3024-day.css";
import "codemirror/theme/3024-night.css";
import "codemirror/theme/abbott.css";
import "codemirror/theme/abcdef.css";
import "codemirror/theme/ambiance.css";
import "codemirror/theme/ayu-dark.css";
import "codemirror/theme/ayu-mirage.css";
import "codemirror/theme/base16-dark.css";
import "codemirror/theme/base16-light.css";
import "codemirror/theme/bespin.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/cobalt.css";
import "codemirror/theme/colorforth.css";
import "codemirror/theme/darcula.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/duotone-dark.css";
import "codemirror/theme/duotone-light.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/elegant.css";
import "codemirror/theme/erlang-dark.css";
import "codemirror/theme/gruvbox-dark.css";
import "codemirror/theme/hopscotch.css";
import "codemirror/theme/icecoder.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/isotope.css";
import "codemirror/theme/juejin.css";
import "codemirror/theme/lesser-dark.css";
import "codemirror/theme/liquibyte.css";
import "codemirror/theme/lucario.css";
import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/mbo.css";
import "codemirror/theme/mdn-like.css";
import "codemirror/theme/midnight.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/moxer.css";
import "codemirror/theme/neat.css";
import "codemirror/theme/neo.css";
import "codemirror/theme/night.css";
import "codemirror/theme/nord.css";
import "codemirror/theme/oceanic-next.css";
import "codemirror/theme/panda-syntax.css";
import "codemirror/theme/paraiso-dark.css";
import "codemirror/theme/paraiso-light.css";
import "codemirror/theme/pastel-on-dark.css";
import "codemirror/theme/railscasts.css";
import "codemirror/theme/rubyblue.css";
import "codemirror/theme/seti.css";
import "codemirror/theme/shadowfox.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/the-matrix.css";
import "codemirror/theme/tomorrow-night-bright.css";
import "codemirror/theme/tomorrow-night-eighties.css";
import "codemirror/theme/ttcn.css";
import "codemirror/theme/twilight.css";
import "codemirror/theme/vibrant-ink.css";
import "codemirror/theme/xq-dark.css";
import "codemirror/theme/xq-light.css";
import "codemirror/theme/yeti.css";
import "codemirror/theme/yonce.css";
import "codemirror/theme/zenburn.css";

// modes
import "codemirror/mode/clike/clike";
import "codemirror/mode/css/css";
import "codemirror/mode/dart/dart";
import "codemirror/mode/django/django";
import "codemirror/mode/dockerfile/dockerfile";
import "codemirror/mode/go/go";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/jsx/jsx";
import "codemirror/mode/markdown/markdown";
import "codemirror/mode/php/php";
import "codemirror/mode/python/python";
import "codemirror/mode/r/r";
import "codemirror/mode/rust/rust";
import "codemirror/mode/ruby/ruby";
import "codemirror/mode/sass/sass";
import "codemirror/mode/shell/shell";
import "codemirror/mode/sql/sql";
import "codemirror/mode/swift/swift";
import "codemirror/mode/xml/xml";
import "codemirror/mode/yaml/yaml";

// features
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/scroll/simplescrollbars.js";

//search
import "codemirror/addon/search/search.js";
import "codemirror/addon/search/searchcursor.js";
import "codemirror/addon/search/jump-to-line.js";
import "codemirror/addon/dialog/dialog.js";
import "codemirror/addon/dialog/dialog.css";

const Editor = React.forwardRef(({ onCodeChange, socketRef, roomId, activeFile, onCursorChange }, ref) => {
  const editorRef = useRef(null);
  const cursorsRef = useRef({}); 
  const lang = useRecoilValue(language);
  const editorTheme = useRecoilValue(cmtheme);

  // Use refs to store the latest prop values and avoid stale closures in event listeners
  const propsRef = useRef({ onCodeChange, roomId, activeFile, onCursorChange });
  
  useEffect(() => {
    propsRef.current = { onCodeChange, roomId, activeFile, onCursorChange };
  }, [onCodeChange, roomId, activeFile, onCursorChange]);

  useImperativeHandle(ref, () => ({
    setCode: (code) => {
      if (editorRef.current && editorRef.current.getValue() !== code) {
        editorRef.current.setValue(code);
      }
    },
    getCode: () => editorRef.current?.getValue() ?? '',
  }));

  useEffect(() => {
    async function init() {
      if (editorRef.current) return; // Prevent double init

      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: lang },
          theme: editorTheme,
          autoCloseTags: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          styleActiveLine: true,
          lineNumbers: true,
          lineWrapping: false,
          scrollbarStyle: "overlay",
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        if (origin !== "setValue") {
          const code = instance.getValue();
          // Use the latest callback from Ref
          propsRef.current.onCodeChange(code);
        }
      });

      editorRef.current.on("cursorActivity", (instance) => {
        const cursor = instance.getCursor();
        propsRef.current.onCursorChange?.(cursor);
        if (socketRef.current) {
          // Use the latest room and file from Ref
          socketRef.current.emit(ACTIONS.CURSOR_MOVE, {
            roomId: propsRef.current.roomId,
            filename: propsRef.current.activeFile,
            cursor,
          });
        }
      });

      // CodeMirror measures its own width once, at creation time. If the
      // surrounding flex layout hasn't finished settling yet, that first
      // measurement can be wrong and leaves a stale/phantom horizontal
      // scrollbar behind. Refresh once layout has actually settled...
      requestAnimationFrame(() => {
        editorRef.current?.refresh();
      });

      // ...and keep it in sync any time its container is resized after
      // that (e.g. dragging the sidebar resizer, or the window itself).
      const wrapperEl = editorRef.current.getWrapperElement();
      let rafId = null;
      const resizeObserver = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          editorRef.current?.refresh();
        });
      });
      resizeObserver.observe(wrapperEl.parentElement || wrapperEl);
      editorRef.current._resizeObserver = resizeObserver;
    }
    init();

    return () => {
        if (editorRef.current) {
            editorRef.current._resizeObserver?.disconnect();
            editorRef.current.toTextArea();
            editorRef.current = null;
        }
    };
  }, []); 
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("mode", { name: lang });
    }
  }, [lang]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("theme", editorTheme);
    }
  }, [editorTheme]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CURSOR_MOVE, ({ socketId, username, filename, cursor }) => {
        // Use latest activeFile from Ref for comparison
        if (filename !== propsRef.current.activeFile) {
          if (cursorsRef.current[socketId]) {
            cursorsRef.current[socketId].clear();
            delete cursorsRef.current[socketId];
          }
          return;
        }

        if (cursorsRef.current[socketId]) {
          cursorsRef.current[socketId].clear();
        }

        const cursorEl = document.createElement('span');
        cursorEl.className = 'remote-cursor';
        cursorEl.style.borderLeftColor = stringToColor(username);
        
        const labelEl = document.createElement('div');
        labelEl.className = 'remote-cursor-label';
        labelEl.style.backgroundColor = stringToColor(username);
        labelEl.innerText = username;
        cursorEl.appendChild(labelEl);

        cursorsRef.current[socketId] = editorRef.current.setBookmark(cursor, {
          widget: cursorEl,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId }) => {
        if (cursorsRef.current[socketId]) {
          cursorsRef.current[socketId].clear();
          delete cursorsRef.current[socketId];
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CURSOR_MOVE);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [socketRef.current]); // Only re-subscribe if socket changes

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 60%)`;
  }

  return <textarea id="realtimeEditor"></textarea>;
});

export default Editor;