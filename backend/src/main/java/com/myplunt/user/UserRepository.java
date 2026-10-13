package com.myplunt.user;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    // Usernames containing the query, exact match first, then those starting with it, then the
    // rest, A to Z within each. query must be lowercase with \, % and _ escaped by a backslash.
    @Query("""
            select u from User u
            where u.id <> :excludedId and lower(u.username) like concat('%', :query, '%') escape '\\'
            order by
                case when lower(u.username) like :query escape '\\' then 0
                     when lower(u.username) like concat(:query, '%') escape '\\' then 1
                     else 2 end,
                u.username
            """)
    List<User> search(String query, UUID excludedId, Limit limit);
}
