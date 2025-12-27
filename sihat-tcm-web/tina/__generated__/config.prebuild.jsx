// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main";
var config_default = defineConfig({
  branch,
  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "tina-admin",
    // preserving existing /admin
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images/blog",
      publicFolder: "public"
    }
  },
  // See docs on content modeling for more info: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "post_en",
        label: "Articles (English)",
        path: "src/content/blog",
        match: {
          include: "{5-tcm-tips-for-better-sleep,how-to-manage-diabetes-naturally-with-tcm,understanding-your-body-constitution-in-tcm,the-healing-power-of-acupuncture-for-chronic-pain,tcm-dietary-therapy-for-digestive-health,herbal-remedies-for-boosting-immunity-this-winter}"
        },
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "coverImage",
            label: "Cover Image"
          },
          {
            type: "datetime",
            name: "date",
            label: "Date"
          },
          {
            type: "object",
            name: "author",
            label: "Author",
            fields: [
              {
                type: "string",
                name: "name",
                label: "Name"
              },
              {
                type: "image",
                name: "picture",
                label: "Picture"
              }
            ]
          },
          {
            type: "object",
            name: "ogImage",
            label: "OG Image",
            fields: [
              {
                type: "image",
                name: "url",
                label: "URL"
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true
          }
        ]
      },
      {
        name: "post_ms",
        label: "Articles (Malay)",
        path: "src/content/blog",
        match: {
          include: "**/*.ms"
        },
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              const slug = values.title?.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") || "new-post";
              return `${slug}.ms`;
            }
          }
        },
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "coverImage",
            label: "Cover Image"
          },
          {
            type: "datetime",
            name: "date",
            label: "Date"
          },
          {
            type: "object",
            name: "author",
            label: "Author",
            fields: [
              { type: "string", name: "name", label: "Name" },
              { type: "image", name: "picture", label: "Picture" }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true
          }
        ]
      },
      {
        name: "post_zh",
        label: "Articles (Chinese)",
        path: "src/content/blog",
        match: {
          include: "**/*.zh"
        },
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              const slug = values.title?.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") || "new-post";
              return `${slug}.zh`;
            }
          }
        },
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "coverImage",
            label: "Cover Image"
          },
          {
            type: "datetime",
            name: "date",
            label: "Date"
          },
          {
            type: "object",
            name: "author",
            label: "Author",
            fields: [
              { type: "string", name: "name", label: "Name" },
              { type: "image", name: "picture", label: "Picture" }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
