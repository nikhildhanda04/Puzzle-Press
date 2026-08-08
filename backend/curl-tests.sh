#!/usr/bin/env bash
set +e

BASE_URL="${BASE_URL:-http://localhost:4000}"
AUTH_COOKIE="${AUTH_COOKIE:-}"
ISSUE_ID="${ISSUE_ID:-replace-with-issue-id}"
ISSUE_SLUG="${ISSUE_SLUG:-issue-001-retro-gaming}"
PUZZLE_ID="${PUZZLE_ID:-replace-with-puzzle-id}"
PROMPT_ID="${PROMPT_ID:-replace-with-prompt-id}"

admin_cookie_args=()
if [ -n "$AUTH_COOKIE" ]; then
  admin_cookie_args=(-H "Cookie: $AUTH_COOKIE")
fi

echo "# Health"
curl -i "$BASE_URL/health"

echo "# Better Auth session"
curl -i "${admin_cookie_args[@]}" "$BASE_URL/api/auth/get-session"

echo "# Better Auth Google sign-in URL"
curl -i -X POST "$BASE_URL/api/auth/sign-in/social" \
  -H 'Content-Type: application/json' \
  -d '{"provider":"google","callbackURL":"/admin"}'

echo "# Public latest issue"
curl -i "$BASE_URL/api/issues/latest"

echo "# Public issue archive"
curl -i "$BASE_URL/api/issues"

echo "# Public issue by slug"
curl -i "$BASE_URL/api/issues/$ISSUE_SLUG"

echo "# Subscribe"
curl -i -X POST "$BASE_URL/api/subscribers" \
  -H 'Content-Type: application/json' \
  -d '{"email":"reader@example.com"}'

echo "# Admin issues"
curl -i "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues"

echo "# Admin create issue"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Issue Draft: Space","theme":"Space","coverImageUrl":""}'

echo "# Admin update issue"
curl -i -X PATCH "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID" \
  -H 'Content-Type: application/json' \
  -d '{"editorNote":"Updated by curl test.","teaser":"Next issue teaser from curl."}'

echo "# Admin update puzzle"
curl -i -X PATCH "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/puzzles/$PUZZLE_ID" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated Puzzle Title","hints":["Try the corners first."]}'

echo "# Admin generate article"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/article"

echo "# Admin generate crossword"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/crossword"

echo "# Admin generate maze"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/maze"

echo "# Admin generate word search"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/word-search"

echo "# Admin generate trivia"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/trivia"

echo "# Admin generate logic"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/generate/logic"

echo "# Admin publish issue"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/issues/$ISSUE_ID/publish"

echo "# Admin prompts"
curl -i "${admin_cookie_args[@]}" "$BASE_URL/api/admin/prompts"

echo "# Admin update prompt"
curl -i -X PATCH "${admin_cookie_args[@]}" "$BASE_URL/api/admin/prompts/$PROMPT_ID" \
  -H 'Content-Type: application/json' \
  -d '{"body":"Create concise, themed, family-friendly puzzle magazine content. Return valid JSON only.","active":true}'

echo "# Admin media"
curl -i "${admin_cookie_args[@]}" "$BASE_URL/api/admin/media"

echo "# Admin create media"
curl -i -X POST "${admin_cookie_args[@]}" "$BASE_URL/api/admin/media" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Space cover","altText":"Retro rocket illustration","url":"https://example.com/space-cover.png","notes":"External URL for MVP."}'

echo "# Admin analytics"
curl -i "${admin_cookie_args[@]}" "$BASE_URL/api/admin/analytics"
