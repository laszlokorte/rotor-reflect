# Rotation via Reflection

Any rotation of subject vector <code>s</code> can be achieved by two
successive reflections. A reflection at vector <code>u</code> followed by a
reflection at vector <code>v</code> results in a rotation in the plane
spanned by vectors <code>u</code> and <code>v</code>. The angle of the
rotation is twice as large as the angle between vector <code>u</code> and
<code>v</code>. So in general to construct a rotation of angle
<code>beta</code>
you just need to construct two vectors that enclose an angle
<code>beta/2</code> and them use them as reflectors for the subject vector.

The pair of vector <code>u</code> and <code>v</code> can be called a rotor.
Only the relative directions between <code>u</code> and <code>v</code>
affect the rotation result. Try drag the arc segment called
<code>rotor</code> below to change the direction of both reflectors at once.

![Preview Screenshot](./preview.png)
