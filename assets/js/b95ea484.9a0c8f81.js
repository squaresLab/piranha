"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[488],{3905:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>f});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var p=a.createContext({}),m=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},s=function(e){var t=m(e.components);return a.createElement(p.Provider,{value:t},e.children)},u="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,p=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),u=m(n),d=r,f=u["".concat(p,".").concat(d)]||u[d]||c[d]||i;return n?a.createElement(f,l(l({ref:t},s),{},{components:n})):a.createElement(f,l({ref:t},s))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,l=new Array(i);l[0]=d;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o[u]="string"==typeof e?e:r,l[1]=o;for(var m=2;m<i;m++)l[m]=n[m];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},7226:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>l,default:()=>c,frontMatter:()=>i,metadata:()=>o,toc:()=>m});var a=n(7462),r=(n(7294),n(3905));const i={id:"api",title:"Python API"},l=void 0,o={unversionedId:"reference/api",id:"reference/api",title:"Python API",description:"Currently, we support one simple API (execute_piranha), a simple python wrapper around Polyglot Piranha's CLI.",source:"@site/docs/reference/api.md",sourceDirName:"reference",slug:"/reference/api",permalink:"/piranha/docs/reference/api",draft:!1,editUrl:"https://github.com/uber/piranha/tree/website/site/docs/reference/api.md",tags:[],version:"current",frontMatter:{id:"api",title:"Python API"},sidebar:"docsSidebar",previous:{title:"Defining edges",permalink:"/piranha/docs/reference/edges"},next:{title:"Command Line Interface",permalink:"/piranha/docs/reference/cli"}},p={},m=[],s={toc:m},u="wrapper";function c(e){let{components:t,...n}=e;return(0,r.kt)(u,(0,a.Z)({},s,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"Currently, we support one simple API (",(0,r.kt)("inlineCode",{parentName:"p"},"execute_piranha"),"), a simple python wrapper around Polyglot Piranha's CLI.\nWe believe this makes it easy to incorporate Piranha in ",(0,r.kt)("em",{parentName:"p"},'"pipelining"'),"."),(0,r.kt)("h4",null," ",(0,r.kt)("code",null,"execute_piranha")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-python"},'from polyglot_piranha import execute_piranha, PiranhaArguments\n\npiranha_arguments = PiranhaArguments(\n    path_to_codebase = "...",\n    path_to_configurations = "...",\n    language= "java",\n    substitutions = {},\n    dry_run = False, \n    cleanup_comments = True\n)\npiranha_summary = execute_piranha(piranha_arguments)\n')),(0,r.kt)("p",null,"The API ",(0,r.kt)("inlineCode",{parentName:"p"},"execute_piranha")," accepts a ",(0,r.kt)("inlineCode",{parentName:"p"},"PiranhaArguments"),"\nAn object of PiranhaArguments can be instantiated with the following arguments:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"required"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"path_to_codebase")," (",(0,r.kt)("inlineCode",{parentName:"li"},"str"),"): Path to source code folder"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"required"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"path_to_configuration")," (",(0,r.kt)("inlineCode",{parentName:"li"},"str"),") : A directory containing files named ",(0,r.kt)("inlineCode",{parentName:"li"},"rules.toml")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"edges.toml"),(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"rules.toml"),": ",(0,r.kt)("em",{parentName:"li"},"piranha rules")," expresses the specific AST patterns to match and ",(0,r.kt)("strong",{parentName:"li"},"replacement patterns")," for these matches (in-place). These rules can also specify the pre-built language specific cleanups to trigger."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"edges.toml")," : expresses the flow between the rules"))),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"required"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"language")," (",(0,r.kt)("inlineCode",{parentName:"li"},"str"),") : Target language (",(0,r.kt)("inlineCode",{parentName:"li"},"java"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"py"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"kt"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"swift"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"py"),", ",(0,r.kt)("inlineCode",{parentName:"li"},"ts")," and ",(0,r.kt)("inlineCode",{parentName:"li"},"tsx"),")"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"required"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"substitutions")," (",(0,r.kt)("inlineCode",{parentName:"li"},"dict"),"): Substitutions to instantiate the initial set of feature flag rules"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"dry_run")," (",(0,r.kt)("inlineCode",{parentName:"li"},"bool"),") : Disables in-place rewriting of code"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"cleanup_comments")," (",(0,r.kt)("inlineCode",{parentName:"li"},"bool"),") : Enables deletion of associated comments"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"cleanup_comments_buffer")," (",(0,r.kt)("inlineCode",{parentName:"li"},"usize"),"): The number of lines to consider for cleaning up the comments"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"number_of_ancestors_in_parent_scope")," (",(0,r.kt)("inlineCode",{parentName:"li"},"usize"),"): The number of ancestors considered when ",(0,r.kt)("inlineCode",{parentName:"li"},"PARENT")," rules"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"delete_file_if_empty")," (",(0,r.kt)("inlineCode",{parentName:"li"},"bool"),"): User option that determines whether an empty file will be deleted"),(0,r.kt)("li",{parentName:"ul"},"(",(0,r.kt)("em",{parentName:"li"},"optional"),") ",(0,r.kt)("inlineCode",{parentName:"li"},"delete_consecutive_new_lines")," (",(0,r.kt)("inlineCode",{parentName:"li"},"bool"),") : Replaces consecutive ",(0,r.kt)("inlineCode",{parentName:"li"},"\\n"),"s  with a single ",(0,r.kt)("inlineCode",{parentName:"li"},"\\n"))),(0,r.kt)("h5",null," Returns "),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"[Piranha_Output]")," : a ",(0,r.kt)("a",{parentName:"p",href:"/src/models/piranha_output.rs"},(0,r.kt)("inlineCode",{parentName:"a"},"PiranhaOutputSummary"))," for each file touched or analyzed by Piranha. It contains useful information like, matches found (for ",(0,r.kt)("em",{parentName:"p"},"match-only")," rules), rewrites performed, and content of the file after the rewrite. The content is particularly useful when ",(0,r.kt)("inlineCode",{parentName:"p"},"dry_run")," is passed as ",(0,r.kt)("inlineCode",{parentName:"p"},"true"),"."))}c.isMDXComponent=!0}}]);