# Writeup 4

## Colors

| Pair                                           | Ratio         | Result |
| ---------------------------------------------- | ------------- | ------ |
| #2a2a2a on green (body text, footer)           | 2.79          | fail   |
| Black on green (plain article text, nav links) | 4.09          | fail   |
| Default blue sidebar links on green            | 1.83          | fail   |
| Default visited purple sidebar links on green  | 2.14          | fail   |
| #2a2a2a on #dde or #def (table, comments)      | 10.70 / 12.13 | pass   |
| White on #333 (buttons)                        | 12.63         | pass   |
| Black on yellow (search highlight)             | 19.56         | pass   |
| Black title on #dde                            | 15.65         | pass   |

## Structure

1. No headings. The page had no h1 and no h2, because every title was a <span>. Users couldn’t jump by heading.

2. Weak landmarks. There was no banner, the nav links weren’t inside a nav, and the sidebar and comments weren’t named regions. The only landmarks were the search form and main, and the search form was unnamed.

3. The comments toggle was invisible. “Show comments” was a <div onClick>, so it was missing from both the tab order and the accessibility tree. Keyboard and screen reader users could never open the comments or the comment form.

4. Unlabelled form fields. The search box was named only by its placeholder. The comment form’s “Your name:” and “Your comment:” were plain text, not <label>s. Errors were shown with window.alert.

5. Search feedback only visual. Highlighting was the only result, so nothing was announced.
   Table without headers. Column headings were <td>, not <th scope="col">.

6. Unnamed audio player. Each of the player’s six tab stops had an empty name.

7. Silent route changes. Navigating changed the content but not the title, and focus stayed where it was, so nothing was announced.

8. Broken links. Every bear name linked to /bears/<id>, but the route is /bear/:bearId, so each one landed on “Page not found”.

9. Smaller issues: no lang attribute, a title of “Buggy Starter”, and no skip link. Loading messages weren’t announced.

### Changes

- added header with an h1
- added aria label to nav
- section headings are now h2s
- replaced div in articleElement with section
- added skip link to main content and added language to html nad per-route page title
- comment button now has aria controls
- inputs have label and alert is replaced by inline role=alert with aria
- added role to search
- added caption to table and table headers

##
