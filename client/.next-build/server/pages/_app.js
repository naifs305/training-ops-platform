/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./context/AuthContext.js":
/*!********************************!*\
  !*** ./context/AuthContext.js ***!
  \********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_axios__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/axios */ \"./lib/axios.js\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_axios__WEBPACK_IMPORTED_MODULE_3__]);\n_lib_axios__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)({});\nconst AuthProvider = ({ children })=>{\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [activeRole, setActiveRole] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        checkUser();\n    }, []);\n    const checkUser = async ()=>{\n        try {\n            const token = localStorage.getItem(\"token\") || sessionStorage.getItem(\"token\");\n            if (token) {\n                const res = await _lib_axios__WEBPACK_IMPORTED_MODULE_3__[\"default\"].get(\"/users/me\");\n                setUser(res.data);\n                const savedRole = localStorage.getItem(\"activeRole\") || sessionStorage.getItem(\"activeRole\");\n                if (savedRole && res.data.roles.includes(savedRole)) {\n                    setActiveRole(savedRole);\n                } else if (res.data.roles.includes(\"MANAGER\")) {\n                    setActiveRole(\"MANAGER\");\n                    localStorage.setItem(\"activeRole\", \"MANAGER\");\n                } else {\n                    setActiveRole(\"EMPLOYEE\");\n                    localStorage.setItem(\"activeRole\", \"EMPLOYEE\");\n                }\n            }\n        } catch (error) {\n            console.error(\"Session invalid - AuthContext.js:36\", error);\n            logout();\n        } finally{\n            setLoading(false);\n        }\n    };\n    const login = async (email, password, rememberMe)=>{\n        const res = await _lib_axios__WEBPACK_IMPORTED_MODULE_3__[\"default\"].post(\"/auth/login\", {\n            email,\n            password\n        });\n        if (rememberMe) {\n            localStorage.setItem(\"token\", res.data.access_token);\n        } else {\n            sessionStorage.setItem(\"token\", res.data.access_token);\n        }\n        setUser(res.data.user);\n        const defaultRole = res.data.user.roles.includes(\"MANAGER\") ? \"MANAGER\" : \"EMPLOYEE\";\n        setActiveRole(defaultRole);\n        if (rememberMe) {\n            localStorage.setItem(\"activeRole\", defaultRole);\n        } else {\n            sessionStorage.setItem(\"activeRole\", defaultRole);\n        }\n        return res.data;\n    };\n    const register = async (data)=>{\n        const res = await _lib_axios__WEBPACK_IMPORTED_MODULE_3__[\"default\"].post(\"/auth/register\", data);\n        localStorage.setItem(\"token\", res.data.access_token);\n        localStorage.setItem(\"activeRole\", \"EMPLOYEE\");\n        setUser(res.data.user);\n        setActiveRole(\"EMPLOYEE\");\n        return res.data;\n    };\n    const logout = ()=>{\n        localStorage.removeItem(\"token\");\n        sessionStorage.removeItem(\"token\");\n        localStorage.removeItem(\"activeRole\");\n        sessionStorage.removeItem(\"activeRole\");\n        setUser(null);\n        setActiveRole(null);\n        next_router__WEBPACK_IMPORTED_MODULE_2___default().push(\"/login\");\n    };\n    const switchRole = (role)=>{\n        if (user && user.roles.includes(role)) {\n            setActiveRole(role);\n            localStorage.setItem(\"activeRole\", role);\n            sessionStorage.setItem(\"activeRole\", role);\n            next_router__WEBPACK_IMPORTED_MODULE_2___default().push(\"/\");\n        }\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: {\n            user,\n            activeRole,\n            login,\n            register,\n            logout,\n            switchRole,\n            loading,\n            setUser\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"C:\\\\dev\\\\training-ops-platform\\\\client\\\\context\\\\AuthContext.js\",\n        lineNumber: 95,\n        columnNumber: 5\n    }, undefined);\n};\nconst useAuth = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useAuth);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFLLENBQUNDLFFBQVEsQ0FBQ2dCLE9BQU87WUFDckM3QixjQUFjNkI7WUFDZHhCLGFBQWFTLE9BQU8sQ0FBQyxjQUFjZTtZQUNuQ3RCLGVBQWVPLE9BQU8sQ0FBQyxjQUFjZTtZQUNyQ3JDLHVEQUFXLENBQUM7UUFDZDtJQUNGO0lBRUEscUJBQ0UsOERBQUNFLFlBQVlvQyxRQUFRO1FBQUNDLE9BQU87WUFBRWxDO1lBQU1FO1lBQVltQjtZQUFPTztZQUFVUjtZQUFRVztZQUFZM0I7WUFBU0g7UUFBUTtrQkFDcEdGOzs7Ozs7QUFHUCxFQUFFO0FBRUssTUFBTW9DLFVBQVUsSUFBTTFDLGlEQUFVQSxDQUFDSSxhQUFhO0FBQ3JELGlFQUFlc0MsT0FBT0EsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2NsaWVudC8uL2NvbnRleHQvQXV0aENvbnRleHQuanM/MTM5OCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDb250ZXh0LCB1c2VTdGF0ZSwgdXNlQ29udGV4dCwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJvdXRlciBmcm9tICduZXh0L3JvdXRlcic7XG5pbXBvcnQgYXBpIGZyb20gJy4uL2xpYi9heGlvcyc7XG5cbmNvbnN0IEF1dGhDb250ZXh0ID0gY3JlYXRlQ29udGV4dCh7fSk7XG5cbmV4cG9ydCBjb25zdCBBdXRoUHJvdmlkZXIgPSAoeyBjaGlsZHJlbiB9KSA9PiB7XG4gIGNvbnN0IFt1c2VyLCBzZXRVc2VyXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbYWN0aXZlUm9sZSwgc2V0QWN0aXZlUm9sZV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjaGVja1VzZXIoKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGNoZWNrVXNlciA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdG9rZW4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKSB8fCBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5nZXQoJy91c2Vycy9tZScpO1xuICAgICAgICBzZXRVc2VyKHJlcy5kYXRhKTtcblxuICAgICAgICBjb25zdCBzYXZlZFJvbGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWN0aXZlUm9sZScpIHx8IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2FjdGl2ZVJvbGUnKTtcblxuICAgICAgICBpZiAoc2F2ZWRSb2xlICYmIHJlcy5kYXRhLnJvbGVzLmluY2x1ZGVzKHNhdmVkUm9sZSkpIHtcbiAgICAgICAgICBzZXRBY3RpdmVSb2xlKHNhdmVkUm9sZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzLmRhdGEucm9sZXMuaW5jbHVkZXMoJ01BTkFHRVInKSkge1xuICAgICAgICAgIHNldEFjdGl2ZVJvbGUoJ01BTkFHRVInKTtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWN0aXZlUm9sZScsICdNQU5BR0VSJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0QWN0aXZlUm9sZSgnRU1QTE9ZRUUnKTtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWN0aXZlUm9sZScsICdFTVBMT1lFRScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Nlc3Npb24gaW52YWxpZCAtIEF1dGhDb250ZXh0LmpzOjM2JywgZXJyb3IpO1xuICAgICAgbG9nb3V0KCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBsb2dpbiA9IGFzeW5jIChlbWFpbCwgcGFzc3dvcmQsIHJlbWVtYmVyTWUpID0+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBhcGkucG9zdCgnL2F1dGgvbG9naW4nLCB7IGVtYWlsLCBwYXNzd29yZCB9KTtcblxuICAgIGlmIChyZW1lbWJlck1lKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXMuZGF0YS5hY2Nlc3NfdG9rZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHJlcy5kYXRhLmFjY2Vzc190b2tlbik7XG4gICAgfVxuXG4gICAgc2V0VXNlcihyZXMuZGF0YS51c2VyKTtcblxuICAgIGNvbnN0IGRlZmF1bHRSb2xlID0gcmVzLmRhdGEudXNlci5yb2xlcy5pbmNsdWRlcygnTUFOQUdFUicpID8gJ01BTkFHRVInIDogJ0VNUExPWUVFJztcbiAgICBzZXRBY3RpdmVSb2xlKGRlZmF1bHRSb2xlKTtcblxuICAgIGlmIChyZW1lbWJlck1lKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWN0aXZlUm9sZScsIGRlZmF1bHRSb2xlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnYWN0aXZlUm9sZScsIGRlZmF1bHRSb2xlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzLmRhdGE7XG4gIH07XG5cbiAgY29uc3QgcmVnaXN0ZXIgPSBhc3luYyAoZGF0YSkgPT4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIGRhdGEpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHJlcy5kYXRhLmFjY2Vzc190b2tlbik7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FjdGl2ZVJvbGUnLCAnRU1QTE9ZRUUnKTtcbiAgICBzZXRVc2VyKHJlcy5kYXRhLnVzZXIpO1xuICAgIHNldEFjdGl2ZVJvbGUoJ0VNUExPWUVFJyk7XG4gICAgcmV0dXJuIHJlcy5kYXRhO1xuICB9O1xuXG4gIGNvbnN0IGxvZ291dCA9ICgpID0+IHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdhY3RpdmVSb2xlJyk7XG4gICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgnYWN0aXZlUm9sZScpO1xuICAgIHNldFVzZXIobnVsbCk7XG4gICAgc2V0QWN0aXZlUm9sZShudWxsKTtcbiAgICBSb3V0ZXIucHVzaCgnL2xvZ2luJyk7XG4gIH07XG5cbiAgY29uc3Qgc3dpdGNoUm9sZSA9IChyb2xlKSA9PiB7XG4gICAgaWYgKHVzZXIgJiYgdXNlci5yb2xlcy5pbmNsdWRlcyhyb2xlKSkge1xuICAgICAgc2V0QWN0aXZlUm9sZShyb2xlKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY3RpdmVSb2xlJywgcm9sZSk7XG4gICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdhY3RpdmVSb2xlJywgcm9sZSk7XG4gICAgICBSb3V0ZXIucHVzaCgnLycpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxBdXRoQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyB1c2VyLCBhY3RpdmVSb2xlLCBsb2dpbiwgcmVnaXN0ZXIsIGxvZ291dCwgc3dpdGNoUm9sZSwgbG9hZGluZywgc2V0VXNlciB9fT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L0F1dGhDb250ZXh0LlByb3ZpZGVyPlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IHVzZUF1dGggPSAoKSA9PiB1c2VDb250ZXh0KEF1dGhDb250ZXh0KTtcbmV4cG9ydCBkZWZhdWx0IHVzZUF1dGg7Il0sIm5hbWVzIjpbImNyZWF0ZUNvbnRleHQiLCJ1c2VTdGF0ZSIsInVzZUNvbnRleHQiLCJ1c2VFZmZlY3QiLCJSb3V0ZXIiLCJhcGkiLCJBdXRoQ29udGV4dCIsIkF1dGhQcm92aWRlciIsImNoaWxkcmVuIiwidXNlciIsInNldFVzZXIiLCJhY3RpdmVSb2xlIiwic2V0QWN0aXZlUm9sZSIsImxvYWRpbmciLCJzZXRMb2FkaW5nIiwiY2hlY2tVc2VyIiwidG9rZW4iLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2Vzc2lvblN0b3JhZ2UiLCJyZXMiLCJnZXQiLCJkYXRhIiwic2F2ZWRSb2xlIiwicm9sZXMiLCJpbmNsdWRlcyIsInNldEl0ZW0iLCJlcnJvciIsImNvbnNvbGUiLCJsb2dvdXQiLCJsb2dpbiIsImVtYWlsIiwicGFzc3dvcmQiLCJyZW1lbWJlck1lIiwicG9zdCIsImFjY2Vzc190b2tlbiIsImRlZmF1bHRSb2xlIiwicmVnaXN0ZXIiLCJyZW1vdmVJdGVtIiwicHVzaCIsInN3aXRjaFJvbGUiLCJyb2xlIiwiUHJvdmlkZXIiLCJ2YWx1ZSIsInVzZUF1dGgiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./context/AuthContext.js\n");

/***/ }),

/***/ "./lib/axios.js":
/*!**********************!*\
  !*** ./lib/axios.js ***!
  \**********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ \"axios\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([axios__WEBPACK_IMPORTED_MODULE_0__]);\naxios__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\nconst instance = axios__WEBPACK_IMPORTED_MODULE_0__[\"default\"].create({\n    baseURL: process.env.NEXT_PUBLIC_API_URL || \"http://localhost:3001/api\",\n    headers: {\n        \"Content-Type\": \"application/json\"\n    }\n});\ninstance.interceptors.request.use((config)=>{\n    if (false) {}\n    return config;\n}, (error)=>{\n    return Promise.reject(error);\n});\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (instance);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvYXhpb3MuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBMEI7QUFFMUIsTUFBTUMsV0FBV0Qsb0RBQVksQ0FBQztJQUM1QkcsU0FBU0MsUUFBUUMsR0FBRyxDQUFDQyxtQkFBbUIsSUFBSTtJQUM1Q0MsU0FBUztRQUNQLGdCQUFnQjtJQUNsQjtBQUNGO0FBRUFOLFNBQVNPLFlBQVksQ0FBQ0MsT0FBTyxDQUFDQyxHQUFHLENBQy9CLENBQUNDO0lBQ0MsSUFBSSxLQUFrQixFQUFhLEVBV2xDO0lBQ0QsT0FBT0E7QUFDVCxHQUNBLENBQUNNO0lBQ0MsT0FBT0MsUUFBUUMsTUFBTSxDQUFDRjtBQUN4QjtBQUdGLGlFQUFlaEIsUUFBUUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2NsaWVudC8uL2xpYi9heGlvcy5qcz85YjI4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5cbmNvbnN0IGluc3RhbmNlID0gYXhpb3MuY3JlYXRlKHtcbiAgYmFzZVVSTDogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaScsXG4gIGhlYWRlcnM6IHtcbiAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICB9LFxufSk7XG5cbmluc3RhbmNlLmludGVyY2VwdG9ycy5yZXF1ZXN0LnVzZShcbiAgKGNvbmZpZykgPT4ge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgdG9rZW4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKSB8fCBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICAgICAgY29uc3QgYWN0aXZlUm9sZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY3RpdmVSb2xlJykgfHwgc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnYWN0aXZlUm9sZScpO1xuXG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgY29uZmlnLmhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCZWFyZXIgJHt0b2tlbn1gO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWN0aXZlUm9sZSkge1xuICAgICAgICBjb25maWcuaGVhZGVyc1sneC1hY3RpdmUtcm9sZSddID0gYWN0aXZlUm9sZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfSxcbiAgKGVycm9yKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgfVxuKTtcblxuZXhwb3J0IGRlZmF1bHQgaW5zdGFuY2U7Il0sIm5hbWVzIjpbImF4aW9zIiwiaW5zdGFuY2UiLCJjcmVhdGUiLCJiYXNlVVJMIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0FQSV9VUkwiLCJoZWFkZXJzIiwiaW50ZXJjZXB0b3JzIiwicmVxdWVzdCIsInVzZSIsImNvbmZpZyIsInRva2VuIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNlc3Npb25TdG9yYWdlIiwiYWN0aXZlUm9sZSIsImVycm9yIiwiUHJvbWlzZSIsInJlamVjdCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./lib/axios.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _context_AuthContext__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../context/AuthContext */ \"./context/AuthContext.js\");\n/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-hot-toast */ \"react-hot-toast\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_context_AuthContext__WEBPACK_IMPORTED_MODULE_1__, react_hot_toast__WEBPACK_IMPORTED_MODULE_2__]);\n([_context_AuthContext__WEBPACK_IMPORTED_MODULE_1__, react_hot_toast__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_AuthContext__WEBPACK_IMPORTED_MODULE_1__.AuthProvider, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_hot_toast__WEBPACK_IMPORTED_MODULE_2__.Toaster, {\n                position: \"top-left\",\n                toastOptions: {\n                    duration: 4000,\n                    style: {\n                        fontFamily: \"Cairo, sans-serif\",\n                        background: \"#FFFFFF\",\n                        color: \"#2F3437\",\n                        border: \"1px solid #D8DDDA\",\n                        borderRadius: \"16px\",\n                        boxShadow: \"0 8px 24px rgba(0, 108, 109, 0.08)\"\n                    },\n                    success: {\n                        iconTheme: {\n                            primary: \"#2E7D5A\",\n                            secondary: \"#FFFFFF\"\n                        }\n                    },\n                    error: {\n                        iconTheme: {\n                            primary: \"#A63D4A\",\n                            secondary: \"#FFFFFF\"\n                        }\n                    }\n                }\n            }, void 0, false, {\n                fileName: \"C:\\\\dev\\\\training-ops-platform\\\\client\\\\pages\\\\_app.js\",\n                lineNumber: 8,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"C:\\\\dev\\\\training-ops-platform\\\\client\\\\pages\\\\_app.js\",\n                lineNumber: 34,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\dev\\\\training-ops-platform\\\\client\\\\pages\\\\_app.js\",\n        lineNumber: 7,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQXNEO0FBQ1o7QUFDWDtBQUVoQixTQUFTRSxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ2xELHFCQUNFLDhEQUFDSiw4REFBWUE7OzBCQUNYLDhEQUFDQyxvREFBT0E7Z0JBQ05JLFVBQVM7Z0JBQ1RDLGNBQWM7b0JBQ1pDLFVBQVU7b0JBQ1ZDLE9BQU87d0JBQ0xDLFlBQVk7d0JBQ1pDLFlBQVk7d0JBQ1pDLE9BQU87d0JBQ1BDLFFBQVE7d0JBQ1JDLGNBQWM7d0JBQ2RDLFdBQVc7b0JBQ2I7b0JBQ0FDLFNBQVM7d0JBQ1BDLFdBQVc7NEJBQ1RDLFNBQVM7NEJBQ1RDLFdBQVc7d0JBQ2I7b0JBQ0Y7b0JBQ0FDLE9BQU87d0JBQ0xILFdBQVc7NEJBQ1RDLFNBQVM7NEJBQ1RDLFdBQVc7d0JBQ2I7b0JBQ0Y7Z0JBQ0Y7Ozs7OzswQkFFRiw4REFBQ2Y7Z0JBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7O0FBRzlCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2xpZW50Ly4vcGFnZXMvX2FwcC5qcz9lMGFkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dGhQcm92aWRlciB9IGZyb20gJy4uL2NvbnRleHQvQXV0aENvbnRleHQnO1xuaW1wb3J0IHsgVG9hc3RlciB9IGZyb20gJ3JlYWN0LWhvdC10b2FzdCc7XG5pbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWxzLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8QXV0aFByb3ZpZGVyPlxuICAgICAgPFRvYXN0ZXJcbiAgICAgICAgcG9zaXRpb249XCJ0b3AtbGVmdFwiXG4gICAgICAgIHRvYXN0T3B0aW9ucz17e1xuICAgICAgICAgIGR1cmF0aW9uOiA0MDAwLFxuICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICBmb250RmFtaWx5OiAnQ2Fpcm8sIHNhbnMtc2VyaWYnLFxuICAgICAgICAgICAgYmFja2dyb3VuZDogJyNGRkZGRkYnLFxuICAgICAgICAgICAgY29sb3I6ICcjMkYzNDM3JyxcbiAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjRDhERERBJyxcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzE2cHgnLFxuICAgICAgICAgICAgYm94U2hhZG93OiAnMCA4cHggMjRweCByZ2JhKDAsIDEwOCwgMTA5LCAwLjA4KScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdWNjZXNzOiB7XG4gICAgICAgICAgICBpY29uVGhlbWU6IHtcbiAgICAgICAgICAgICAgcHJpbWFyeTogJyMyRTdENUEnLFxuICAgICAgICAgICAgICBzZWNvbmRhcnk6ICcjRkZGRkZGJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBlcnJvcjoge1xuICAgICAgICAgICAgaWNvblRoZW1lOiB7XG4gICAgICAgICAgICAgIHByaW1hcnk6ICcjQTYzRDRBJyxcbiAgICAgICAgICAgICAgc2Vjb25kYXJ5OiAnI0ZGRkZGRicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxuICAgIDwvQXV0aFByb3ZpZGVyPlxuICApO1xufSJdLCJuYW1lcyI6WyJBdXRoUHJvdmlkZXIiLCJUb2FzdGVyIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwicG9zaXRpb24iLCJ0b2FzdE9wdGlvbnMiLCJkdXJhdGlvbiIsInN0eWxlIiwiZm9udEZhbWlseSIsImJhY2tncm91bmQiLCJjb2xvciIsImJvcmRlciIsImJvcmRlclJhZGl1cyIsImJveFNoYWRvdyIsInN1Y2Nlc3MiLCJpY29uVGhlbWUiLCJwcmltYXJ5Iiwic2Vjb25kYXJ5IiwiZXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("axios");;

/***/ }),

/***/ "react-hot-toast":
/*!**********************************!*\
  !*** external "react-hot-toast" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = import("react-hot-toast");;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();